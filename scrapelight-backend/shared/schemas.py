"""
Pydantic schemas for API request/response models
"""
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class StoresModel(Enum):
    All = "all"
    NovaLuce = "nova luce"

class SpecSearchBody(BaseModel):
    details: Optional[str] = None
    bulb_type: Optional[str] = None
    dimensions: Optional[str] = None
    category: Optional[str] = None
    store: StoresModel = StoresModel.All

class PredictionResult(BaseModel):
    product_label: str
    similarity: float
    matching_image_path: str
    article: str
    product_id: int
    product_title: str
    url: str
    bulb_type: str
    dimensions: str
    image_url: str

class SearchResponse(BaseModel):
    items_found: int
    predictions: List[PredictionResult]
    status: str

class ErrorResponse(BaseModel):
    error: str
    status: str

class PictureSearchResponse(SearchResponse):
    pass


class SpecSearchResponse(SearchResponse):
    pass


# ============== Authentication Schemas ==============
class UserCreate(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=100, description="Password (min 6 characters)")


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")


class UserResponse(BaseModel):
    """Schema for user data in responses"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    email: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


class TokenResponse(BaseModel):
    """Schema for token responses"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(default=3600, description="Access token expiration in seconds")


class TokenRefresh(BaseModel):
    """Schema for token refresh requests"""
    refresh_token: str


class TokenData(BaseModel):
    """Schema for token payload data"""
    username: Optional[str] = None
    user_id: Optional[int] = None


class PasswordChange(BaseModel):
    """Schema for password change requests"""
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    """Schema for user profile updates"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)


# ============== Response Schemas ==============

class Message(BaseModel):
    """Generic message response"""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    status_code: int


# ============== Search History Schemas ==============

class SearchHistoryCreate(BaseModel):
    """Schema for creating search history entry"""
    search_type: str = Field(..., pattern="^(picture|spec)$")
    query_data: dict
    results_count: int = 0
    results_summary: Optional[dict] = None


class SearchHistoryResponse(BaseModel):
    """Schema for search history response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    search_type: str
    query_data: dict
    results_count: int
    results_summary: Optional[dict]
    created_at: Optional[datetime]


# ============== Saved Items Schemas ==============

class SavedItemCreate(BaseModel):
    """Schema for saving an item"""
    product_id: str
    product_title: str
    product_url: Optional[str] = None
    product_image_url: Optional[str] = None
    product_data: Optional[dict] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class SavedItemUpdate(BaseModel):
    """Schema for updating a saved item"""
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class SavedItemResponse(BaseModel):
    """Schema for saved item response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    product_id: str
    product_title: str
    product_url: Optional[str]
    product_image_url: Optional[str]
    product_data: Optional[dict]
    notes: Optional[str]
    tags: Optional[List[str]]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


# ============== User Profile Extended Schemas ==============

class UserProfileResponse(UserResponse):
    """Extended user profile with additional stats"""
    search_count: int = 0
    saved_items_count: int = 0


# ============== Existing Schemas (if any) ==============
# Add your existing schemas here to maintain compatibility