import os
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import faiss
from pathlib import Path
import json

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
SENTIMENT_MODEL = os.getenv(
    "SENTIMENT_MODEL",
    "EBSQ/amazon-sentiment-distilbert",
)

app = FastAPI(title="Ecommercery AI Service", version="2.0.0")

_embedder: Optional[SentenceTransformer] = None
_sentiment = None
_catalog: List[Dict[str, Any]] = []
_embeddings: Optional[np.ndarray] = None
_faiss_index = None
INDEX_DIR = Path(os.getenv("VECTOR_INDEX_DIR", "data/vector_index"))
INDEX_FILE = INDEX_DIR / "products.faiss"
CATALOG_FILE = INDEX_DIR / "catalog.json"


def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
    return _embedder


def get_sentiment():
    global _sentiment
    if _sentiment is None:
        _sentiment = pipeline("sentiment-analysis", model=SENTIMENT_MODEL)
    return _sentiment


def product_text(product: Dict[str, Any]) -> str:
    return " | ".join(
        str(x or "")
        for x in [
            product.get("name"),
            product.get("description"),
            product.get("category"),
            product.get("deliveryInfo"),
        ]
    )


class Product(BaseModel):
    id: str
    name: str = ""
    description: str = ""
    category: str = ""
    price: float = 0
    imageUrl: str = ""


class CatalogRequest(BaseModel):
    products: List[Product] = Field(default_factory=list)


class SearchRequest(BaseModel):
    query: str = Field(min_length=2)
    top_k: int = Field(default=8, ge=1, le=50)


class SentimentRequest(BaseModel):
    text: str = Field(min_length=2, max_length=5000)


class RecommendRequest(BaseModel):
    product_id: Optional[str] = None
    query: Optional[str] = None
    top_k: int = Field(default=6, ge=1, le=20)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "embedding_model": EMBEDDING_MODEL,
        "sentiment_model": SENTIMENT_MODEL,
        "catalog_size": len(_catalog),
        "index_ready": _faiss_index is not None and bool(_catalog),
    }


@app.post("/catalog/index")
def index_catalog(payload: CatalogRequest):
    global _catalog, _embeddings, _faiss_index
    _catalog = [p.model_dump() for p in payload.products]
    if not _catalog:
        _embeddings = None
        _faiss_index = None
        return {"success": True, "count": 0}
    texts = [product_text(p) for p in _catalog]
    _embeddings = get_embedder().encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    ).astype("float32")
    _faiss_index = faiss.IndexFlatIP(_embeddings.shape[1])
    _faiss_index.add(_embeddings)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(_faiss_index, str(INDEX_FILE))
    CATALOG_FILE.write_text(json.dumps(_catalog, ensure_ascii=False), encoding="utf-8")
    return {"success": True, "count": len(_catalog), "dimension": int(_embeddings.shape[1]), "index": str(INDEX_FILE)}


def ensure_index():
    if _faiss_index is None or not _catalog:
        raise HTTPException(status_code=409, detail="Product vector index is empty. Refresh the catalog first.")


def ranked_products(query: str, top_k: int):
    ensure_index()
    q = get_embedder().encode([query], normalize_embeddings=True, convert_to_numpy=True).astype("float32")
    scores, indices = _faiss_index.search(q, min(top_k, len(_catalog)))
    order = indices[0]
    score_row = scores[0]
    return [
        {**_catalog[int(i)], "similarity": round(float(score_row[pos]), 4)}
        for pos, i in enumerate(order) if int(i) >= 0
    ]


@app.post("/search")
def semantic_search(payload: SearchRequest):
    return {"success": True, "results": ranked_products(payload.query, payload.top_k)}


@app.post("/recommend")
def recommend(payload: RecommendRequest):
    ensure_index()
    query = payload.query
    if not query and payload.product_id:
        source = next((p for p in _catalog if p["id"] == payload.product_id), None)
        if not source:
            raise HTTPException(status_code=404, detail="Product not found in AI catalog")
        query = product_text(source)
    if not query:
        raise HTTPException(status_code=400, detail="product_id or query is required")
    results = ranked_products(query, payload.top_k + (1 if payload.product_id else 0))
    if payload.product_id:
        results = [x for x in results if x["id"] != payload.product_id][: payload.top_k]
    else:
        results = results[: payload.top_k]
    return {"success": True, "results": results}


@app.post("/sentiment")
def sentiment(payload: SentimentRequest):
    result = get_sentiment()(payload.text, truncation=True)[0]
    label = str(result["label"]).upper()
    score = float(result["score"])
    positive = label in {"LABEL_1", "POSITIVE", "1"}
    return {
        "success": True,
        "label": "positive" if positive else "negative",
        "score": round(score, 4),
        "model": SENTIMENT_MODEL,
    }


@app.on_event("startup")
def load_persisted_index():
    global _catalog, _faiss_index
    if INDEX_FILE.exists() and CATALOG_FILE.exists():
        try:
            _faiss_index = faiss.read_index(str(INDEX_FILE))
            _catalog = json.loads(CATALOG_FILE.read_text(encoding="utf-8"))
        except Exception:
            _faiss_index = None
            _catalog = []
