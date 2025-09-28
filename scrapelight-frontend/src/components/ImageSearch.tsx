import React, { useState } from 'react';
import { searchByPicture } from '@/api/client';
import type { PredictionResult, StoresModel } from '@/types/api';

export function ImageSearch() {
  const [file, setFile] = useState<File | null>(null);
  const [store, setStore] = useState<StoresModel>('all');
  const [topK, setTopK] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PredictionResult[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please select an image');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await searchByPicture({ file, store, top_k: topK, wait: true });
      setResults(data.predictions);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Search by picture</h2>
      <form onSubmit={onSubmit}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div className="row">
          <label>
            Store
            <select value={store} onChange={(e) => setStore(e.target.value as StoresModel)}>
              <option value="all">All</option>
              <option value="nova luce">Nova Luce</option>
            </select>
          </label>
          <label>
            Top K
            <input type="number" min={1} max={100} value={topK} onChange={(e) => setTopK(Number(e.target.value))} />
          </label>
        </div>
        <button disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {results.length > 0 && (
        <ul className="results">
          {results.map((r) => (
            <li key={r.product_id}>
              <div className="result">
                <div className="meta">
                  <a href={r.url} target="_blank" rel="noreferrer">{r.product_title}</a>
                  <span>Similarity: {r.similarity.toFixed(3)}</span>
                  <span>Bulb: {r.bulb_type}</span>
                  <span>Dimensions: {r.dimensions}</span>
                </div>
                <div className="img">
                  <img src={r.matching_image_path} alt={r.product_label} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


