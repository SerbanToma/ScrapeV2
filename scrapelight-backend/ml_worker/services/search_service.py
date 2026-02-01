import os
import re
from typing import Optional, Dict, Any

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import sys
from pathlib import Path

from shared import StoresModel
from shared.db_models import Product

sys.path.append(str(Path(__file__).parent.parent))

from .processing_service import FeatureExtractor
from .database_service import DatabaseManager
from shared.config import settings
from shared.logger import setup_logger

logger = setup_logger(__name__)


class SearchService:
    """Predict product matches using trained model and database features"""

    def __init__(self, model_path=None, db_manager=None):
        if model_path is None:
            model_path = settings.ml_model

        self.extractor = FeatureExtractor(str(model_path))
        self.db_manager = db_manager or DatabaseManager()
        # Lazy-loaded cache for features to avoid re-reading from DB each task
        self._feature_cache: Optional[Dict[str, Any]] = None
        self._normalized_feature_matrix: Optional[np.ndarray] = None
        self._labels: Optional[list] = None
        self._paths: Optional[list] = None

    def _load_feature_cache(self):
        """Load and normalize feature matrix once per worker process."""
        if self._feature_cache is None:
            db_features = self.db_manager.get_all_features()
            features: np.ndarray = db_features.get('features', np.array([]))
            if features.size == 0:
                self._feature_cache = {'features': np.array([]), 'labels': [], 'paths': []}
                self._normalized_feature_matrix = np.array([])
                self._labels = []
                self._paths = []
                return

            # L2-normalize features once so cosine similarity is a fast dot product
            norms = np.linalg.norm(features, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self._normalized_feature_matrix = features / norms
            self._labels = db_features['labels']
            self._paths = db_features['paths']
            self._feature_cache = db_features
            logger.info(f"Feature cache loaded with {len(self._labels)} normalized vectors")

    @staticmethod
    def _safe_extract_label_from_path(image_path: str) -> str:
        """Cross-platform extraction of label directory name."""
        try:
            from pathlib import PurePath
            # Normalize separators and take parent directory name
            return PurePath(image_path).parent.name
        except Exception:
            return "unknown"

    def predict_image(self, image_path, store="all", top_k=20):
        """Predict which product an image belongs to"""
        try:
            feature_count = self.db_manager.get_feature_count()
            if feature_count == 0:
                logger.error("No features found in database")
                return []

            # Extract features for input image
            logger.info(f"Extracting features for image: {image_path}")
            query_features = self.extractor.extract_single_image_features(image_path)

            # Load cached features
            logger.info("Loading feature cache")
            self._load_feature_cache()

            if self._normalized_feature_matrix is None or self._normalized_feature_matrix.size == 0:
                logger.error("No features found in database. Perform backup actions: migrate if needed else update db")
                return []

            # Normalize query once
            q = query_features.astype(np.float32)
            q_norm = np.linalg.norm(q)
            if q_norm == 0:
                return []
            q = q / q_norm

            # Fast numpy-based similarity search (much faster than sklearn cosine_similarity)
            logger.info(f"Computing similarities for {self._normalized_feature_matrix.shape[0]} features using numpy")

            # Compute similarities using numpy dot product (pre-normalized vectors = cosine similarity)
            similarities = np.dot(self._normalized_feature_matrix, q)

            # Get top-k indices using numpy's optimized argpartition (faster than full sort)
            pool_size = min(len(similarities), max(100, top_k * 5))
            candidate_indices = np.argpartition(similarities, -pool_size)[-pool_size:]
            top_indices = candidate_indices[np.argsort(similarities[candidate_indices])[::-1]]

            # Get unique top-k products
            unique_products = {}
            for idx in top_indices:
                if len(unique_products) >= top_k:
                    break

                product_id_db = self._labels[idx]
                # Use a dictionary to store the best match for each unique product
                if product_id_db not in unique_products:
                    similarity = similarities[idx]
                    image_path_db = self._paths[idx]

                    # Extract product label using stored Windows-style paths
                    try:
                        product_label = str(image_path_db).split('\\')[1]
                    except Exception:
                        product_label = "unknown"
                    if product_label == "unknown":
                        continue

                    try:
                        # Ensure label contains an underscore and split once to keep rest intact
                        if '_' not in product_label:
                            continue
                        article, product_id_str = product_label.split('_', 1)
                        db_product = self.db_manager.get_product_by_product_id_and_article(product_id_str, article,
                                                                                           store)
                        image_url = self.db_manager.get_public_url_by_path(image_path_db)
                        if db_product:
                            unique_products[product_id_db] = {
                                'product_label': product_label,
                                'similarity': float(similarity),
                                'matching_image_path': image_path_db,
                                'product_id': db_product.id,
                                'url': db_product.url,
                                'article': db_product.article,
                                'product_title': db_product.product_title,
                                'bulb_type': db_product.bulb_type,
                                'dimensions': db_product.dimensions,
                                'image_url': image_url
                            }
                    except Exception as e:
                        logger.error(f"Error processing product {product_label}: {str(e)}")
                        continue

            return list(unique_products.values())
        except Exception as e:
            logger.error(f"Error in predict_image: {str(e)}")
            return []

    def _extract_label_from_path(self, image_path):
        """Extract product label from image path"""
        try:
            # Ensure the path is a string
            if isinstance(image_path, bytes):
                image_path = image_path.decode('utf-8')
            elif not isinstance(image_path, str):
                image_path = str(image_path)

            # Extract from path like: .../training_images_new/MILEY_9202261/9202261_0.jpg
            from pathlib import Path
            return Path(image_path).parent.name
        except Exception as e:
            logger.error(f"Error extracting label from path {image_path}: {str(e)}")
            return "unknown"

    def search_by_picture_and_display_results(self, image_path, store="all", top_k=20):
        """Predict and display results nicely"""
        if not os.path.exists(image_path):
            logger.error(f"Image file not found: {image_path}")
            raise FileNotFoundError(f"Image file not found: {image_path}")

        logger.info(f"Predicting for image: {image_path}")
        results = self.predict_image(image_path, store, top_k)

        if not results:
            logger.info("No matches found")
            return []
        return results

    def search_by_specifications_and_display_results(
            self,
            details: Optional[str],
            bulb_type: Optional[str],
            dimensions: Optional[str],
            category: Optional[str],
            store: str = StoresModel.All.value,
    ):
        logger.info(f"Searching for paramteres: {details}, {bulb_type}, {dimensions}, {category}, {store}")

        spec_results = self.db_manager.get_product_by_specifications(details, bulb_type, dimensions, category, store)

        if not spec_results:
            logger.info("No matches found")
            return []

        logger.info(f"Found {len(spec_results)} matches:")
        return spec_results