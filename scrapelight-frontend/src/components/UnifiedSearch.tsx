import React, { useEffect, useMemo, useState, FormEvent } from 'react';
import { 
	searchByPicture, 
	searchBySpecifications, 
	toProxiedImageUrl,
	createSearchHistory,
	saveItem,
	getSavedItems
} from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PredictionResult, StoresModel } from '@/types/api';

type Mode = 'picture' | 'spec';

export function UnifiedSearch() {
	const { isAuthenticated } = useAuth();
	const [mode, setMode] = useState<Mode>('picture');

	// shared
	const [store, setStore] = useState<StoresModel>('all');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<PredictionResult[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
	const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// picture
	const [file, setFile] = useState<File | null>(null);
	const [topK, setTopK] = useState<number>(20);

	// spec
	const [details, setDetails] = useState('');
	const [bulbType, setBulbType] = useState('');
	const [dimensions, setDimensions] = useState('');
	const [category, setCategory] = useState('');

	// Load saved items when component mounts or user authentication changes
	useEffect(() => {
		if (isAuthenticated) {
			loadSavedItems();
		} else {
			setSavedItems(new Set());
		}
	}, [isAuthenticated]);

	const loadSavedItems = async () => {
		if (!isAuthenticated) return;
		
		try {
			const items = await getSavedItems();
			const savedProductIds = new Set(items.map(item => item.product_id));
			setSavedItems(savedProductIds);
		} catch (err) {
			console.warn('Failed to load saved items:', err);
		}
	};

	function switchMode(next: Mode) {
		setMode(next);
		setError(null);
		setSuccessMessage(null);
		// keep results when switching so users can compare, but reset pager
		setCurrentIndex(0);
	}

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			let searchData;
			let queryData;

			if (mode === 'picture') {
				if (!file) {
					setError('Please select an image');
					return;
				}
				searchData = await searchByPicture({ file, store, top_k: topK, wait: true });
				queryData = {
					file_name: file.name,
					file_size: file.size,
					store,
					top_k: topK
				};
			} else {
				searchData = await searchBySpecifications({
					details,
					bulb_type: bulbType,
					dimensions,
					category,
					store,
					wait: true,
				});
				queryData = {
					details,
					bulb_type: bulbType,
					dimensions,
					category,
					store
				};
			}

			setResults(searchData.predictions);
			setCurrentIndex(0);

			// Track search history if user is authenticated
			if (isAuthenticated && searchData.predictions.length > 0) {
				try {
					await createSearchHistory({
						search_type: mode,
						query_data: queryData,
						results_count: searchData.predictions.length,
						results_summary: {
							top_results: searchData.predictions.slice(0, 3),
							total_found: searchData.predictions.length,
							search_timestamp: new Date().toISOString()
						}
					});
				} catch (historyErr) {
					console.warn('Failed to save search history:', historyErr);
					// Don't show error to user, just log it
				}
			}

		} catch (err: any) {
			setError(err?.response?.data?.detail || 'Search failed');
		} finally {
			setLoading(false);
		}
	}

	const current = useMemo(() => {
		if (results.length === 0) return null;
		return results[Math.min(Math.max(currentIndex, 0), results.length - 1)];
	}, [results, currentIndex]);

	useEffect(() => {
		if (!current) return;
		// Debug: verify which image URL is being rendered at runtime
		// eslint-disable-next-line no-console
		console.log('UnifiedSearch current item', { image_url: (current as any).image_url, item: current });
	}, [current]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			if (results.length === 0) return;
			
			if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
				e.preventDefault();
				goPrev();
			} else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
				e.preventDefault();
				goNext();
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, [results.length]);

	function goPrev() {
		setCurrentIndex((idx: number) => Math.max(idx - 1, 0));
	}

	function goNext() {
		setCurrentIndex((idx: number) => Math.min(idx + 1, Math.max(results.length - 1, 0)));
	}

	async function handleSaveItem(item: PredictionResult) {
		if (!isAuthenticated) {
			setError('Please log in to save items');
			return;
		}

		const itemId = item.product_id.toString();
		
		if (savedItems.has(itemId)) {
			return; // Already saved
		}

		setSavingItems((prev: Set<string>) => new Set([...prev, itemId]));

		try {
			await saveItem({
				product_id: itemId,
				product_title: item.product_title,
				product_url: item.url,
				product_image_url: (item as any).image_url,
				product_data: {
					bulb_type: item.bulb_type,
					dimensions: item.dimensions,
					similarity: item.similarity,
					article: item.article
				}
			});

			setSavedItems((prev: Set<string>) => new Set([...prev, itemId]));
		setSuccessMessage('Item saved to favorites!');
		setTimeout(() => setSuccessMessage(null), 3000);
		} catch (err: any) {
			if (err?.response?.status === 409) {
				// Item already saved
				setSavedItems((prev: Set<string>) => new Set([...prev, itemId]));
				setSuccessMessage('Item was already in your favorites');
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError(err?.response?.data?.detail || 'Failed to save item');
			}
		} finally {
			setSavingItems((prev: Set<string>) => {
				const newSet = new Set(prev);
				newSet.delete(itemId);
				return newSet;
			});
		}
	}

	return (
		<div className="card">
			<div className="toggle">
				<button
					type="button"
					className={mode === 'picture' ? 'active' : ''}
					onClick={() => switchMode('picture')}
				>
					Picture
				</button>
				<button
					type="button"
					className={mode === 'spec' ? 'active' : ''}
					onClick={() => switchMode('spec')}
				>
					Specifications
				</button>
			</div>

			<form onSubmit={onSubmit}>
				{mode === 'picture' ? (
					<>
						<div className="file-upload">
							<input 
								type="file" 
								accept="image/*" 
								onChange={(e) => setFile(e.target.files?.[0] || null)} 
								id="file-input"
								className="file-input"
							/>
							<label htmlFor="file-input" className="file-label">
								{file ? (
									<span>📷 {file.name}</span>
								) : (
									<span>📁 Choose Image File</span>
								)}
							</label>
						</div>
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
					</>
				) : (
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
				)}
				<button disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
			</form>

			{error && <p className="error">{error}</p>}
			{successMessage && <p className="success">{successMessage}</p>}

			{results.length > 0 && current && (
				<div className="results-one">
					<div className="result">
						<div className="meta">
							<div className="result-header">
								<a href={current.url} target="_blank" rel="noreferrer">{current.product_title}</a>
								{isAuthenticated && (
									<button 
										type="button"
										className={`save-btn ${savedItems.has(current.product_id.toString()) ? 'saved' : ''}`}
										onClick={() => handleSaveItem(current)}
										disabled={savingItems.has(current.product_id.toString()) || savedItems.has(current.product_id.toString())}
										title={savedItems.has(current.product_id.toString()) ? 'Already in saved items' : 'Save to favorites'}
									>
										{savingItems.has(current.product_id.toString()) ? '⏳' : 
										 savedItems.has(current.product_id.toString()) ? '✅' : '🤍'}
									</button>
								)}
							</div>
							<span>Similarity: {current.similarity.toFixed(3)}</span>
							<span>Bulb: {current.bulb_type}</span>
							<span>Dimensions: {current.dimensions}</span>
						</div>
						<div className="img">
							<img
								src={toProxiedImageUrl((current as any).image_url)}
								alt={current.product_label}
								referrerPolicy="no-referrer"
								crossOrigin="anonymous"
								onError={(e) => {
									// eslint-disable-next-line no-console
									console.warn('Image failed to load', (current as any).image_url);
								}}
							/>
						</div>
					</div>
					<div className="results-footer">
						<div className="results-info">
							<span className="results-count">
								Showing {currentIndex + 1} of {results.length} results
							</span>
							<span className="results-hint">
								Use arrow keys or buttons to navigate
							</span>
						</div>
						<div className="pager">
							<button type="button" onClick={goPrev} disabled={currentIndex === 0} aria-label="Previous">‹</button>
							<span className="pager-info">{currentIndex + 1} / {results.length}</span>
							<button type="button" onClick={goNext} disabled={currentIndex >= results.length - 1} aria-label="Next">›</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}


