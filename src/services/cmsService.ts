import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

const getAuthHeaders = (contentType: string = 'application/json') => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': contentType,
  };
};

// ==================== Content Types ====================

export const getContentTypes = async (knowledgeBaseId?: number) => {
  const params = new URLSearchParams();
  if (knowledgeBaseId) params.append('knowledge_base_id', knowledgeBaseId.toString());
  const response = await axios.get(`${API_URL}/api/v1/cms/types/?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getContentType = async (slug: string) => {
  const response = await axios.get(`${API_URL}/api/v1/cms/types/${slug}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createContentType = async (data: {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  knowledge_base_id?: number;
  field_schema?: any[];
  allow_public_publish?: boolean;
}) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/types/`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateContentType = async (slug: string, data: {
  name?: string;
  description?: string;
  icon?: string;
  field_schema?: any[];
  allow_public_publish?: boolean;
}) => {
  const response = await axios.put(`${API_URL}/api/v1/cms/types/${slug}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteContentType = async (slug: string) => {
  const response = await axios.delete(`${API_URL}/api/v1/cms/types/${slug}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== Content Items ====================

export interface ContentItemFilters {
  status?: string;
  visibility?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const getContentItems = async (typeSlug: string, filters?: ContentItemFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.visibility) params.append('visibility', filters.visibility);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/items/${typeSlug}?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getContentItem = async (typeSlug: string, itemId: number) => {
  const response = await axios.get(`${API_URL}/api/v1/cms/items/${typeSlug}/${itemId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createContentItem = async (typeSlug: string, data: {
  data: Record<string, any>;
  status?: string;
  visibility?: string;
  knowledge_base_id?: number;
  category_ids?: number[];
}) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/items/${typeSlug}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateContentItem = async (typeSlug: string, itemId: number, data: {
  data?: Record<string, any>;
  status?: string;
  visibility?: string;
  category_ids?: number[];
}) => {
  const response = await axios.put(`${API_URL}/api/v1/cms/items/${typeSlug}/${itemId}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteContentItem = async (typeSlug: string, itemId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/cms/items/${typeSlug}/${itemId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const publishContentItem = async (typeSlug: string, itemId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/items/${typeSlug}/${itemId}/publish`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const archiveContentItem = async (typeSlug: string, itemId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/items/${typeSlug}/${itemId}/archive`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const changeVisibility = async (typeSlug: string, itemId: number, visibility: string) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/items/${typeSlug}/${itemId}/visibility`,
    { visibility },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// ==================== Media ====================

export interface MediaFilters {
  media_type?: string;
  search?: string;
  skip?: number;
  limit?: number;
  knowledge_base_id?: number;
}

export const uploadMedia = async (file: File, knowledgeBaseId?: number, altText?: string, caption?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (knowledgeBaseId) formData.append('knowledge_base_id', knowledgeBaseId.toString());
  if (altText) formData.append('alt_text', altText);
  if (caption) formData.append('caption', caption);

  const response = await axios.post(`${API_URL}/api/v1/cms/media/upload`, formData, {
    headers: getAuthHeaders('multipart/form-data'),
  });
  return response.data;
};

export const getMediaList = async (filters?: MediaFilters) => {
  const params = new URLSearchParams();
  if (filters?.media_type) params.append('media_type', filters.media_type);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters?.knowledge_base_id !== undefined) params.append('knowledge_base_id', filters.knowledge_base_id.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/media/?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getMedia = async (mediaId: number) => {
  const response = await axios.get(`${API_URL}/api/v1/cms/media/${mediaId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateMedia = async (mediaId: number, data: { alt_text?: string; caption?: string }) => {
  const response = await axios.put(`${API_URL}/api/v1/cms/media/${mediaId}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteMedia = async (mediaId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/cms/media/${mediaId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getMediaUrl = async (mediaId: number, expiresIn: number = 3600) => {
  const response = await axios.get(`${API_URL}/api/v1/cms/media/${mediaId}/url?expires_in=${expiresIn}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== Categories ====================

export const getCategories = async (knowledgeBaseId?: number, parentId?: number, includeAll: boolean = true) => {
  const params = new URLSearchParams();
  if (knowledgeBaseId) params.append('knowledge_base_id', knowledgeBaseId.toString());
  if (parentId !== undefined) params.append('parent_id', parentId.toString());
  params.append('include_all', includeAll.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/categories/?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCategoryTree = async (knowledgeBaseId?: number) => {
  const params = new URLSearchParams();
  if (knowledgeBaseId) params.append('knowledge_base_id', knowledgeBaseId.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/categories/tree?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createCategory = async (data: {
  name: string;
  knowledge_base_id?: number;
  parent_id?: number;
  description?: string;
  icon?: string;
  slug?: string;
  display_order?: number;
}) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/categories/`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateCategory = async (categoryId: number, data: {
  name?: string;
  description?: string;
  icon?: string;
  parent_id?: number;
  display_order?: number;
}) => {
  const response = await axios.put(`${API_URL}/api/v1/cms/categories/${categoryId}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteCategory = async (categoryId: number, deleteChildren: boolean = false) => {
  const response = await axios.delete(
    `${API_URL}/api/v1/cms/categories/${categoryId}?delete_children=${deleteChildren}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// ==================== Tags ====================

export const getTags = async (search?: string, skip?: number, limit?: number) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (skip !== undefined) params.append('skip', skip.toString());
  if (limit !== undefined) params.append('limit', limit.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/tags/?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createTag = async (data: { name: string; color?: string }) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/tags/`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateTag = async (tagId: number, data: { name?: string; color?: string }) => {
  const response = await axios.put(`${API_URL}/api/v1/cms/tags/${tagId}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteTag = async (tagId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/cms/tags/${tagId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== Search ====================

export const searchContent = async (query: string, contentTypeSlug?: string, knowledgeBaseId?: number, limit: number = 10) => {
  const params = new URLSearchParams();
  params.append('q', query);
  if (contentTypeSlug) params.append('content_type_slug', contentTypeSlug);
  if (knowledgeBaseId) params.append('knowledge_base_id', knowledgeBaseId.toString());
  params.append('limit', limit.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/search/?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const searchMarketplace = async (query: string, contentTypeSlug?: string, limit: number = 10) => {
  const params = new URLSearchParams();
  params.append('q', query);
  if (contentTypeSlug) params.append('content_type_slug', contentTypeSlug);
  params.append('limit', limit.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/search/marketplace?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== Publishing / Marketplace ====================

export const getMarketplaceItems = async (contentTypeSlug?: string, search?: string, skip?: number, limit?: number) => {
  const params = new URLSearchParams();
  if (contentTypeSlug) params.append('content_type_slug', contentTypeSlug);
  if (search) params.append('search', search);
  if (skip !== undefined) params.append('skip', skip.toString());
  if (limit !== undefined) params.append('limit', limit.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/publishing/marketplace?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getFeaturedMarketplaceItems = async (limit: number = 10) => {
  const response = await axios.get(`${API_URL}/api/v1/cms/publishing/marketplace/featured?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const copyFromMarketplace = async (originalItemId: number, knowledgeBaseId?: number) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/publishing/marketplace/copy`, {
    original_item_id: originalItemId,
    knowledge_base_id: knowledgeBaseId,
  }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== API Tokens ====================

export const getApiTokens = async (knowledgeBaseId?: number) => {
  const params = new URLSearchParams();
  if (knowledgeBaseId) params.append('knowledge_base_id', knowledgeBaseId.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/publishing/api-tokens?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createApiToken = async (data: {
  name: string;
  knowledge_base_id?: number;
  can_read?: boolean;
  can_search?: boolean;
  rate_limit?: number;
  expires_at?: string;
}) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/publishing/api-tokens`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateApiToken = async (tokenId: number, data: {
  name?: string;
  can_read?: boolean;
  can_search?: boolean;
  rate_limit?: number;
  is_active?: boolean;
  expires_at?: string;
}) => {
  const response = await axios.put(`${API_URL}/api/v1/cms/publishing/api-tokens/${tokenId}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteApiToken = async (tokenId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/cms/publishing/api-tokens/${tokenId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const regenerateApiToken = async (tokenId: number) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/publishing/api-tokens/${tokenId}/regenerate`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== Export ====================

export const createExport = async (data: {
  format: 'json' | 'csv';
  knowledge_base_id?: number;
  content_type_id?: number;
  status?: string;
  visibility?: string;
}) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/publishing/exports`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getExports = async (knowledgeBaseId?: number, skip?: number, limit?: number) => {
  const params = new URLSearchParams();
  if (knowledgeBaseId !== undefined) params.append('knowledge_base_id', knowledgeBaseId.toString());
  if (skip !== undefined) params.append('skip', skip.toString());
  if (limit !== undefined) params.append('limit', limit.toString());

  const response = await axios.get(`${API_URL}/api/v1/cms/publishing/exports?${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getExportStatus = async (exportId: number) => {
  const response = await axios.get(`${API_URL}/api/v1/cms/publishing/exports/${exportId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const downloadExport = async (exportId: number, expiresIn: number = 3600) => {
  const response = await axios.get(
    `${API_URL}/api/v1/cms/publishing/exports/${exportId}/download?expires_in=${expiresIn}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteExport = async (exportId: number) => {
  const response = await axios.delete(`${API_URL}/api/v1/cms/publishing/exports/${exportId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const exportImmediate = async (data: {
  format: 'json' | 'csv';
  knowledge_base_id?: number;
  content_type_id?: number;
  status?: string;
}) => {
  const response = await axios.post(`${API_URL}/api/v1/cms/publishing/exports/immediate`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
