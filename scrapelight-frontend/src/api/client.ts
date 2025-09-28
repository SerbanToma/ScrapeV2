import axios, { AxiosError } from 'axios';
import type { 
  SearchResponse, 
  StoresModel,
  User,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  RefreshTokenRequest,
  PasswordChangeRequest,
  UserUpdateRequest,
  ApiMessage,
  ApiError,
  SearchHistoryEntry,
  SavedItem,
  SavedItemCreate,
  SavedItemUpdate,
  UserProfile
} from '@/types/api';

// Token management
let accessToken: string | null = localStorage.getItem('access_token');
let refreshToken: string | null = localStorage.getItem('refresh_token');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

// Request interceptor to add auth header
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Extend AxiosRequestConfig to include retry flag
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (refreshToken) {
        try {
          const response = await refreshAccessToken();
          setTokens(response.access_token, response.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearTokens();
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Token management functions
export function setTokens(newAccessToken: string, newRefreshToken: string) {
  accessToken = newAccessToken;
  refreshToken = newRefreshToken;
  localStorage.setItem('access_token', newAccessToken);
  localStorage.setItem('refresh_token', newRefreshToken);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}

export async function searchByPicture(params: {
  file: File;
  store?: StoresModel;
  top_k?: number;
  wait?: boolean;
}): Promise<SearchResponse> {
  const formData = new FormData();
  formData.append('file', params.file);
  const { data } = await api.post('/search/by_picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: {
      store: params.store,
      top_k: params.top_k,
      wait: params.wait,
    },
  });
  return data;
}

export async function searchBySpecifications(params: {
  details?: string;
  bulb_type?: string;
  dimensions?: string;
  category?: string;
  store?: StoresModel;
  wait?: boolean;
}): Promise<SearchResponse> {
  const { data } = await api.post('/search/by_specifications', null, {
    params: {
      details: params.details,
      bulb_type: params.bulb_type,
      dimensions: params.dimensions,
      category: params.category,
      store: params.store,
      wait: params.wait,
    },
  });
  return data;
}

// Authentication API functions
export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/login', credentials);
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function register(userData: RegisterRequest): Promise<User> {
  const { data } = await api.post<User>('/auth/register', userData);
  return data;
}

export async function logout(): Promise<ApiMessage> {
  try {
    const { data } = await api.post<ApiMessage>('/auth/logout');
    return data;
  } finally {
    clearTokens();
  }
}

export async function refreshAccessToken(): Promise<TokenResponse> {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const { data } = await axios.post<TokenResponse>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refresh_token: refreshToken }
  );
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}

export async function updateUserProfile(updates: UserUpdateRequest): Promise<User> {
  const { data } = await api.put<User>('/auth/me', updates);
  return data;
}

export async function changePassword(passwordData: PasswordChangeRequest): Promise<ApiMessage> {
  const { data } = await api.post<ApiMessage>('/auth/change-password', passwordData);
  return data;
}

export async function validateToken(): Promise<ApiMessage> {
  const { data } = await api.get<ApiMessage>('/auth/validate');
  return data;
}

// ============== Profile & User Data ==============

export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/profile/me');
  return data;
}

// ============== Search History ==============

export async function getSearchHistory(params?: {
  limit?: number;
  offset?: number;
  search_type?: 'picture' | 'spec';
}): Promise<SearchHistoryEntry[]> {
  const { data } = await api.get<SearchHistoryEntry[]>('/profile/search-history', { params });
  return data;
}

export async function createSearchHistory(searchData: {
  search_type: 'picture' | 'spec';
  query_data: any;
  results_count: number;
  results_summary?: any;
}): Promise<SearchHistoryEntry> {
  const { data } = await api.post<SearchHistoryEntry>('/profile/search-history', searchData);
  return data;
}

export async function deleteSearchHistory(searchId: number): Promise<ApiMessage> {
  const { data } = await api.delete<ApiMessage>(`/profile/search-history/${searchId}`);
  return data;
}

export async function clearSearchHistory(): Promise<ApiMessage> {
  const { data } = await api.delete<ApiMessage>('/profile/search-history');
  return data;
}

// ============== Saved Items ==============

export async function getSavedItems(params?: {
  limit?: number;
  offset?: number;
  tag?: string;
}): Promise<SavedItem[]> {
  const { data } = await api.get<SavedItem[]>('/profile/saved-items', { params });
  return data;
}

export async function saveItem(itemData: SavedItemCreate): Promise<SavedItem> {
  const { data } = await api.post<SavedItem>('/profile/saved-items', itemData);
  return data;
}

export async function updateSavedItem(itemId: number, updates: SavedItemUpdate): Promise<SavedItem> {
  const { data } = await api.put<SavedItem>(`/profile/saved-items/${itemId}`, updates);
  return data;
}

export async function deleteSavedItem(itemId: number): Promise<ApiMessage> {
  const { data } = await api.delete<ApiMessage>(`/profile/saved-items/${itemId}`);
  return data;
}

export async function getSavedItemTags(): Promise<string[]> {
  const { data } = await api.get<string[]>('/profile/saved-items/tags');
  return data;
}

// Helper to transform external image URLs through backend proxy when needed
export function toProxiedImageUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    // Only proxy http/https external hosts
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const proxied = new URL('/image-proxy', base);
      proxied.searchParams.set('url', url);
      return proxied.toString();
    }
  } catch {
    // fall through
  }
  return url;
}


