import torch
import torch.nn as nn
from torchvision import models
from shared.logger import setup_logger


logger = setup_logger(__name__)


class FastSiameseNetwork(nn.Module):
    """
    Fast Siamese network for learning image embeddings
    Uses lightweight MobileNetV2 as backbone instead of ResNet50
    """

    def __init__(self, embedding_dim=256):
        super(FastSiameseNetwork, self).__init__()

        # Use MobileNetV2 instead of ResNet50 (much faster)
        # Avoid downloading pretrained weights at runtime; we load our own weights below.
        # For torchvision >=0.13 use weights=None (pretrained is deprecated).
        try:
            self.backbone = models.mobilenet_v2(weights=None)
        except TypeError:
            # Fallback for older torchvision versions
            self.backbone = models.mobilenet_v2(pretrained=False)
        
        # Remove the classifier
        self.backbone.classifier = nn.Identity()

        # Add custom embedding layer (smaller than ResNet50)
        self.embedding = nn.Sequential(
            nn.Linear(1280, 512),  # MobileNetV2 has 1280 features
            nn.ReLU(),
            nn.Dropout(0.3),  # Reduced dropout
            nn.Linear(512, embedding_dim),
            L2Norm(dim=1)
        )

    def forward(self, x):
        # extract features
        features = self.backbone(x)
        
        # get embeddings
        embeddings = self.embedding(features)
        return embeddings


class UltraFastSiameseNetwork(nn.Module):
    """
    Ultra-fast Siamese network using EfficientNet-B0
    Even faster than MobileNetV2
    """

    def __init__(self, embedding_dim=128):
        super(UltraFastSiameseNetwork, self).__init__()

        # Use EfficientNet-B0 (very fast)
        self.backbone = models.efficientnet_b0(pretrained=True)
        
        # Remove the classifier
        self.backbone.classifier = nn.Identity()

        # Add custom embedding layer
        self.embedding = nn.Sequential(
            nn.Linear(1280, 256),  # EfficientNet-B0 has 1280 features
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, embedding_dim),
            L2Norm(dim=1)
        )

    def forward(self, x):
        features = self.backbone(x)
        embeddings = self.embedding(features)
        return embeddings


# L2 normalization layer
class L2Norm(nn.Module):
    def __init__(self, dim=1):
        super(L2Norm, self).__init__()
        self.dim = dim

    def forward(self, x):
        return nn.functional.normalize(x, p=2, dim=self.dim)


class TripletLoss(nn.Module):
    """
    Triplet loss for metric learning
    """
    def __init__(self, margin=0.5):
        super(TripletLoss, self).__init__()
        self.margin = margin

    def forward(self, anchor, positive, negative):
        # calculate distances
        pos_dist = torch.pow(anchor - positive, 2).sum(dim=1)
        neg_dist = torch.pow(anchor - negative, 2).sum(dim=1)

        # triplet loss
        loss = torch.relu(pos_dist - neg_dist + self.margin)
        return loss.mean()
