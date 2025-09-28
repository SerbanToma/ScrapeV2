import React, { useState } from 'react';
import { searchBySpecifications } from '@/api/client';
import type { PredictionResult, StoresModel } from '@/types/api';

export function SpecSearch() {
  const [details, setDetails] = useState('');
  const [bulbType, setBulbType] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [category, setCategory] = useState('');
  const [store, setStore] = useState<StoresModel>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PredictionResult[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await searchBySpecifications({ details, bulb_type: bulbType, dimensions, category, store, wait: true });
      setResults(data.predictions);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Search by specifications</h2>
      <form onSubmit={onSubmit}>
        <div className="grid">
          <label>
            Details
            <input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. modern brass wall lamp" />
          </label>
          <label>
            Bulb type
            <input value={bulbType} onChange={(e) => setBulbType(e.target.value)} placeholder="e.g. E27" />
          </label>
          <label>
            Dimensions
            <input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="e.g. 20x15cm" />
          </label>
          <label>
            Category
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. wall light" />
          </label>
          <label>
            Store
            <select value={store} onChange={(e) => setStore(e.target.value as StoresModel)}>
              <option value="all">All</option>
              <option value="nova luce">Nova Luce</option>
            </select>
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


