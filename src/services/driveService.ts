import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

export interface DriveItem {
  id: number;
  company_id: number;
  owner_id: number | null;
  parent_id: number | null;
  name: string;
  is_folder: boolean;
  s3_key: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  download_url?: string;
}

export interface DriveListResponse {
  items: DriveItem[];
  total_count: number;
}

export interface DriveStats {
  total_bytes: number;
  file_count: number;
  folder_count: number;
}

export const listFolder = async (
  parentId: number | null,
  sortBy: 'name' | 'date' | 'size' = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
): Promise<DriveListResponse> => {
  const params: Record<string, string> = { sort_by: sortBy, sort_dir: sortDir };
  if (parentId !== null) params.parent_id = String(parentId);
  const res = await axios.get(`${API_BASE_URL}/api/v1/drive/items`, {
    params,
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const createFolder = async (name: string, parentId: number | null): Promise<DriveItem> => {
  const res = await axios.post(
    `${API_BASE_URL}/api/v1/drive/folders`,
    { name, parent_id: parentId },
    { headers: getAuthHeaders() },
  );
  return res.data;
};

export const uploadFile = async (
  file: File,
  parentId: number | null,
  onProgress?: (pct: number) => void,
): Promise<DriveItem> => {
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();
  formData.append('file', file);
  if (parentId !== null) formData.append('parent_id', String(parentId));
  const res = await axios.post(`${API_BASE_URL}/api/v1/drive/files`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1))),
  });
  return res.data;
};

export const renameItem = async (itemId: number, name: string): Promise<DriveItem> => {
  const res = await axios.patch(
    `${API_BASE_URL}/api/v1/drive/items/${itemId}`,
    { name },
    { headers: getAuthHeaders() },
  );
  return res.data;
};

export const moveItem = async (itemId: number, newParentId: number | null): Promise<DriveItem> => {
  const res = await axios.patch(
    `${API_BASE_URL}/api/v1/drive/items/${itemId}`,
    { parent_id: newParentId },
    { headers: getAuthHeaders() },
  );
  return res.data;
};

export const deleteItem = async (itemId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/drive/items/${itemId}`, {
    headers: getAuthHeaders(),
  });
};

export const getDownloadUrl = async (
  itemId: number,
  expiresIn = 3600,
): Promise<{ url: string; expires_at: string }> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/drive/items/${itemId}/download-url`, {
    params: { expires_in: expiresIn },
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getBreadcrumb = async (itemId: number): Promise<DriveItem[]> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/drive/items/${itemId}/breadcrumb`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const searchItems = async (query: string, limit = 50): Promise<DriveListResponse> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/drive/search`, {
    params: { q: query, limit },
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getStorageStats = async (): Promise<DriveStats> => {
  const res = await axios.get(`${API_BASE_URL}/api/v1/drive/stats`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};
