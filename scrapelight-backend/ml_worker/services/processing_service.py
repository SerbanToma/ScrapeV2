"""
Standalone feature extractor for trained models
"""
import shutil
import sys
import tempfile

import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
from pathlib import Path

from tqdm import tqdm

from shared.config import settings
from nn_model_fast import FastSiameseNetwork

from shared.logger import setup_logger

logger = setup_logger(__name__)


class FeatureExtractionDataset(Dataset):
    """Dataset for feature extraction from all products"""

    def __init__(self, products_dir, transform=None):
        self.products_dir = Path(products_dir)
        self.transform = transform
        self.data = []

        self._load_all_images()

    def _load_all_images(self):
        """Load all images from products directory"""
        for product_dir in self.products_dir.iterdir():
            if product_dir.is_dir():
                product_label = product_dir.name

                for img_path in product_dir.glob('*.jpg'):
                    self.data.append((str(img_path), product_label))

        logger.info(f"Loaded {len(self.data)} images for feature extraction")

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        img_path, label = self.data[idx]
        image = Image.open(img_path).convert('RGB')

        if self.transform:
            image = self.transform(image)

        return image, img_path, label


def resource_path(relative_path: str) -> Path:
    """Resolves a PyInstaller-compatible path"""
    if hasattr(sys, '_MEIPASS'):
        return Path(sys._MEIPASS) / relative_path
    return Path(__file__).parent / relative_path


class FeatureExtractor:
    """Extract and save features using trained model"""

    def __init__(self, model_path):
        self.model_path = model_path
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        # self.db_manager = DatabaseManager()

        # Resolve model path correctly (whether frozen or not)
        model_source = resource_path(model_path)

        # Extract to a temporary path
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            shutil.copyfile(model_source, tmp_file.name)
            model_path_on_disk = tmp_file.name

        # Load model
        self.model = FastSiameseNetwork(embedding_dim=256).to(self.device)
        self.model.load_state_dict(torch.load(model_path_on_disk, map_location=self.device))
        self.model.eval()

        logger.info(f"Loaded model from {model_path}")

        # Define transform
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _get_product_id(self, label):
        """Map product label to database product_id"""
        # Simple hash-based mapping - you might want to improve this
        return abs(hash(label)) % 1000000

    def extract_single_image_features(self, image_path):
        """Extract features for a single image"""
        try:
            # Ensure the path is a string and handle any encoding issues
            if isinstance(image_path, bytes):
                image_path = image_path.decode('utf-8')
            elif not isinstance(image_path, str):
                image_path = str(image_path)
            
            logger.info(f"Opening image at path: {image_path}")
            image = Image.open(image_path).convert('RGB')
            
            if self.transform:
                image = self.transform(image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                features = self.model(image)
                return features.cpu().numpy()[0]
        except Exception as e:
            logger.error(f"Error extracting features from {image_path}: {str(e)}")
            raise e
