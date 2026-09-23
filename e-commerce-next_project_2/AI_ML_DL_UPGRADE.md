# AI/ML/DL Upgrade

## Real AI pipeline

- Sentence Transformer: `sentence-transformers/all-MiniLM-L6-v2`
- Vector index: FAISS `IndexFlatIP` with normalized embeddings
- Sentiment: DistilBERT fine-tuned on Amazon product reviews: `EBSQ/amazon-sentiment-distilbert`
- Evaluation: Precision@K for retrieval/recommendation and F1 for sentiment

## Run

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

In another terminal:

```bash
npm install
npm run dev
```

Open `/ai-lab`. The first catalog indexing call downloads the embedding model and creates `ai-service/data/vector_index/products.faiss`.

## Amazon sentiment fine-tuning

A reproducible fine-tuning script is included in `scripts/train_sentiment_amazon.py`. It uses the Amazon Polarity dataset and DistilBERT. Install `requirements-train.txt` before running it.

## Evaluation

Sentiment CSV:
`text,label` with `positive`/`negative` labels.

Recommendation CSV:
`query,relevant_product_ids`, with comma-separated relevant product IDs.

```bash
python scripts/evaluate.py --sentiment-csv data/sentiment_test.csv
python scripts/evaluate.py --recommendation-csv data/recommendation_test.csv --k 5
```

Do not claim metrics until the evaluation scripts are run on your held-out data.
