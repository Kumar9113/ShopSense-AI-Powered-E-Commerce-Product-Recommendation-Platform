"""Evaluate sentiment F1 and recommendation Precision@K.

Sentiment CSV columns: text,label where label is positive/negative.
Recommendation CSV columns: query,relevant_product_ids, where relevant IDs are comma-separated.
"""
import argparse, csv, os
from typing import List
import numpy as np
from sklearn.metrics import precision_recall_fscore_support
from transformers import pipeline

parser = argparse.ArgumentParser()
parser.add_argument("--sentiment-csv")
parser.add_argument("--recommendation-csv")
parser.add_argument("--k", type=int, default=5)
parser.add_argument("--sentiment-model", default=os.getenv("SENTIMENT_MODEL", "EBSQ/amazon-sentiment-distilbert"))
args = parser.parse_args()

if args.sentiment_csv:
    clf = pipeline("sentiment-analysis", model=args.sentiment_model)
    y_true, y_pred = [], []
    with open(args.sentiment_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            y_true.append(row["label"].strip().lower())
            out = clf(row["text"], truncation=True)[0]["label"].upper()
            y_pred.append("positive" if out in {"POSITIVE", "LABEL_1", "1"} else "negative")
    p, r, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="binary", pos_label="positive", zero_division=0)
    print(f"Sentiment precision={p:.4f} recall={r:.4f} F1={f1:.4f}")

if args.recommendation_csv:
    # This metric assumes each row's relevant_product_ids are ground-truth relevant items.
    # Replace retrieve(query) with your production retrieval call or import the service's indexer.
    from pathlib import Path
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from app.main import ranked_products, load_persisted_index
    load_persisted_index()
    precisions=[]
    with open(args.recommendation_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            relevant=set(x.strip() for x in row["relevant_product_ids"].split(",") if x.strip())
            results=ranked_products(row["query"], args.k)
            retrieved=[x["id"] for x in results]
            hits=sum(1 for x in retrieved if x in relevant)
            precisions.append(hits / max(1, args.k))
    print(f"Precision@{args.k}={float(np.mean(precisions)):.4f}")
