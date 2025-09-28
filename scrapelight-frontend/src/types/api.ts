export type StoresModel = 'all' | 'nova luce';

export interface PredictionResult {
  product_label: string;
  similarity: number;
  matching_image_path: string;
  image_url?: string;
  article: string;
  product_id: number;
  product_title: string;
  url: string;
  bulb_type: string;
  dimensions: string;
}

export interface SearchResponse {
  items_found: number;
  predictions: PredictionResult[];
  status: string;
}

// Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
  last_login: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
}

export interface ApiMessage {
  message: string;
  detail?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// Extended User Profile
export interface UserProfile extends User {
  search_count: number;
  saved_items_count: number;
}

// Search History Types
export interface SearchHistoryEntry {
  id: number;
  search_type: 'picture' | 'spec';
  query_data: any;
  results_count: number;
  results_summary?: any;
  created_at: string;
}

// Saved Items Types
export interface SavedItem {
  id: number;
  product_id: string;
  product_title: string;
  product_url?: string;
  product_image_url?: string;
  product_data?: any;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface SavedItemCreate {
  product_id: string;
  product_title: string;
  product_url?: string;
  product_image_url?: string;
  product_data?: any;
  notes?: string;
  tags?: string[];
}

export interface SavedItemUpdate {
  notes?: string;
  tags?: string[];
}


