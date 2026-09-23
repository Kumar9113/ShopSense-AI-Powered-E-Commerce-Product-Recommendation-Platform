"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function ProductCard({ product }) {
  const productId = product.id || product._id;

  if (!productId) return null;

  return (
    <Link
      href={`/product/${productId}`}
      aria-label={`View ${product.name}`}
      className="group block overflow-hidden rounded-2xl border border-brand-light bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand"
    >
      <div className="aspect-[4/3] overflow-hidden bg-brand-light">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {product.category || "Collection"}
        </p>
        <h3 className="mt-1 line-clamp-1 font-display text-lg font-medium text-ink">
          {product.name}
        </h3>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-semibold text-ink">₹{product.price}</span>
          {product.similarity !== undefined && (
            <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand">
              {Math.round(product.similarity * 100)}% match
            </span>
          )}
        </div>
        <div className="mt-3 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
          View product →
        </div>
      </div>
    </Link>
  );
}

export default function AILab() {
  const [query, setQuery] = useState("");
  const [review, setReview] = useState("");
  const [results, setResults] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetch("/api/ai/catalog", { method: "POST" }).catch(() => {}); }, []);

  async function searchProducts(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setMessage("");
    try {
      let response = await fetch("/api/ai/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, top_k: 8 }) });
      let data = await response.json();
      if (response.status === 409) {
        await fetch("/api/ai/catalog", { method: "POST" });
        response = await fetch("/api/ai/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, top_k: 8 }) });
        data = await response.json();
      }
      if (!response.ok) throw new Error(data.detail || data.error || "Search failed");
      setResults(data.results || []);
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  async function analyzeReview() {
    if (!review.trim()) return;
    setSentimentLoading(true); setMessage("");
    try {
      const response = await fetch("/api/ai/sentiment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: review }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || "Sentiment analysis failed");
      setSentiment(data);
    } catch (error) { setMessage(error.message); }
    finally { setSentimentLoading(false); }
  }

  return (
    <main className="min-h-screen bg-canvas pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="rounded-3xl bg-ink px-6 py-10 text-white shadow-xl sm:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-light">Intelligent shopping</p>
          <div className="mt-3 max-w-3xl">
            <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">Find products by meaning, not just keywords.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">Describe what you are looking for naturally. Our AI understands the product catalogue and finds the closest matches.</p>
          </div>
          <form onSubmit={searchProducts} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: lightweight clothes for a summer trip" className="min-h-14 flex-1 rounded-xl border border-white/10 bg-white px-5 text-sm text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-brand-light" />
            <button disabled={loading} className="min-h-14 rounded-xl bg-brand px-7 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">{loading ? "Finding…" : "Find products"}</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
            {["comfortable running shoes", "casual summer outfit", "kids fashion"].map((item) => <button key={item} onClick={() => setQuery(item)} className="rounded-full border border-white/15 px-3 py-1.5 hover:bg-white/10">{item}</button>)}
          </div>
        </section>

        {message && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Personalized discovery</p><h2 className="mt-1 font-display text-2xl font-medium text-ink">Recommended matches</h2></div>
            {results.length > 0 && <span className="text-xs text-muted">{results.length} products found</span>}
          </div>
          {results.length ? <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{results.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-brand-light bg-white p-10 text-center"><p className="font-medium text-ink">Start with a natural-language search</p><p className="mt-1 text-sm text-muted">Your results will appear here with semantic match scores.</p></div>}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-2xl border border-brand-light bg-white p-6 shadow-sm sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Customer voice</p>
            <h2 className="mt-1 font-display text-2xl font-medium text-ink">Understand product reviews</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Paste a review and the language model will estimate whether the sentiment is positive or negative.</p>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={6} placeholder="Example: The fabric feels premium and the fit is perfect." className="mt-5 w-full rounded-xl border border-brand-light p-4 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-light" />
            <button onClick={analyzeReview} disabled={sentimentLoading} className="mt-4 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{sentimentLoading ? "Analyzing…" : "Analyze review"}</button>
          </div>
          <div className="rounded-2xl border border-brand-light bg-brand-light p-6 sm:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Result</p>
            {sentiment ? <div className="mt-10"><div className="text-4xl font-display font-medium capitalize text-ink">{sentiment.label}</div><p className="mt-3 text-sm text-muted">Model confidence: {Math.round(sentiment.score * 100)}%</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand" style={{ width: `${sentiment.score * 100}%` }} /></div></div> : <div className="mt-10 text-sm leading-6 text-muted">Your review insight will appear here after analysis.</div>}
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {[['Semantic search','Sentence embeddings understand meaning across product names and descriptions.'],['Smart recommendations','Products are retrieved by vector similarity from the live catalogue.'],['Review intelligence','A real DistilBERT classifier analyzes review sentiment.']].map(([title, text]) => <div key={title} className="rounded-2xl border border-brand-light bg-white p-6"><h3 className="font-medium text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div>)}
        </section>
      </div>
    </main>
  );
}
