// ==================== Enums ====================

export type FieldType =
  | 'text'
  | 'rich_text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'media'
  | 'audio'
  | 'video'
  | 'file'
  | 'relation'
  | 'tags'
  | 'url'
  | 'email'
  | 'json';

export type ContentStatus = 'draft' | 'published' | 'archived';

export type ContentVisibility = 'private' | 'company' | 'marketplace' | 'public';

// ==================== Field Schema ====================

export interface FieldSettings {
  placeholder?: string;
  options?: string[];
  multiple?: boolean;
  target_type?: string;
  allowed_types?: string[];
  min?: number;
  max?: number;
  [key: string]: any;
}

export interface FieldDefinition {
  slug: string;
  name: string;
  type: FieldType;
  required?: boolean;
  searchable?: boolean;
  settings?: FieldSettings;
}

// ==================== Content Type ====================

export interface ContentType {
  id: number;
  company_id: number;
  knowledge_base_id?: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  field_schema: FieldDefinition[];
  allow_public_publish: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentTypeCreate {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  knowledge_base_id?: number;
  field_schema?: FieldDefinition[];
  allow_public_publish?: boolean;
}

export interface ContentTypeUpdate {
  name?: string;
  description?: string;
  icon?: string;
  field_schema?: FieldDefinition[];
  allow_public_publish?: boolean;
}

// ==================== Content Item ====================

export interface ContentItem {
  id: number;
  content_type_id: number;
  company_id: number;
  knowledge_base_id?: number;
  data: Record<string, any>;
  status: ContentStatus;
  visibility: ContentVisibility;
  is_featured: boolean;
  download_count: number;
  rating?: number;
  version: number;
  chroma_doc_id?: string;
  created_by: number;
  updated_by: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  content_type?: ContentType;
  categories?: ContentCategory[];
}

export interface ContentItemCreate {
  data: Record<string, any>;
  status?: ContentStatus;
  visibility?: ContentVisibility;
  knowledge_base_id?: number;
  category_ids?: number[];
}

export interface ContentItemUpdate {
  data?: Record<string, any>;
  status?: ContentStatus;
  visibility?: ContentVisibility;
  category_ids?: number[];
}

export interface ContentItemsResponse {
  items: ContentItem[];
  total: number;
  content_type: ContentType;
}

// ==================== Media ====================

export type MediaType = 'image' | 'audio' | 'video' | 'file';

export interface ContentMedia {
  id: number;
  company_id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  media_type: MediaType;
  s3_bucket: string;
  s3_key: string;
  thumbnail_s3_key?: string;
  width?: number;
  height?: number;
  duration?: number;
  alt_text?: string;
  caption?: string;
  usage_count: number;
  uploaded_by: number;
  created_at: string;
  url?: string;
  thumbnail_url?: string;
}

export interface MediaListResponse {
  items: ContentMedia[];
  total: number;
}

// ==================== Category ====================

export interface ContentCategory {
  id: number;
  company_id: number;
  knowledge_base_id?: number;
  parent_id?: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  children?: ContentCategory[];
}

export interface CategoryCreate {
  name: string;
  knowledge_base_id?: number;
  parent_id?: number;
  description?: string;
  icon?: string;
  slug?: string;
  display_order?: number;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  icon?: string;
  parent_id?: number;
  display_order?: number;
}

// ==================== Tag ====================

export interface ContentTag {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  color?: string;
  usage_count: number;
}

export interface TagListResponse {
  items: ContentTag[];
  total: number;
}

// ==================== Search ====================

export interface SearchResult {
  id: number;
  content_type_slug: string;
  data: Record<string, any>;
  score: number;
  highlights: {
    matched_text?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

// ==================== Marketplace ====================

export interface MarketplaceItem {
  id: number;
  content_type_slug: string;
  content_type_name: string;
  data: Record<string, any>;
  is_featured: boolean;
  download_count: number;
  company_name?: string;
  created_at: string;
}

export interface MarketplaceListResponse {
  items: MarketplaceItem[];
  total: number;
}

// ==================== API Token ====================

export interface ApiToken {
  id: number;
  company_id: number;
  knowledge_base_id?: number;
  token: string;
  name?: string;
  can_read: boolean;
  can_search: boolean;
  rate_limit: number;
  last_used_at?: string;
  request_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface ApiTokenCreate {
  name: string;
  knowledge_base_id?: number;
  can_read?: boolean;
  can_search?: boolean;
  rate_limit?: number;
  expires_at?: string;
}

// ==================== Export ====================

export type ExportFormat = 'json' | 'csv';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ContentExport {
  id: number;
  company_id: number;
  knowledge_base_id?: number;
  format: ExportFormat;
  status: ExportStatus;
  file_size?: number;
  item_count?: number;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface ExportDownloadResponse {
  download_url: string;
  expires_in: number;
}

// ==================== UI State ====================

export interface CMSPageState {
  selectedContentType?: ContentType;
  searchQuery: string;
  statusFilter?: ContentStatus;
  visibilityFilter?: ContentVisibility;
  currentPage: number;
  pageSize: number;
}

// Field type display info for UI
export const FIELD_TYPE_INFO: Record<FieldType, { label: string; icon: string; description: string }> = {
  text: { label: 'Text', icon: 'Type', description: 'Single line text input' },
  rich_text: { label: 'Rich Text', icon: 'FileText', description: 'Multi-line formatted text' },
  number: { label: 'Number', icon: 'Hash', description: 'Numeric value' },
  boolean: { label: 'Boolean', icon: 'ToggleLeft', description: 'True/false toggle' },
  date: { label: 'Date', icon: 'Calendar', description: 'Date picker' },
  datetime: { label: 'Date & Time', icon: 'Clock', description: 'Date and time picker' },
  select: { label: 'Select', icon: 'List', description: 'Dropdown selection' },
  media: { label: 'Image', icon: 'Image', description: 'Image file' },
  audio: { label: 'Audio', icon: 'Music', description: 'Audio file' },
  video: { label: 'Video', icon: 'Video', description: 'Video file' },
  file: { label: 'File', icon: 'File', description: 'Any file type' },
  relation: { label: 'Relation', icon: 'Link', description: 'Link to other content' },
  tags: { label: 'Tags', icon: 'Tags', description: 'Multiple tags' },
  url: { label: 'URL', icon: 'Globe', description: 'Web URL' },
  email: { label: 'Email', icon: 'Mail', description: 'Email address' },
  json: { label: 'JSON', icon: 'Code', description: 'Raw JSON data' },
};

export const STATUS_INFO: Record<ContentStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
  published: { label: 'Published', color: 'bg-green-100 text-green-800' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800' },
};

export const VISIBILITY_INFO: Record<ContentVisibility, { label: string; icon: string; description: string }> = {
  private: { label: 'Private', icon: 'Lock', description: 'Only you can see' },
  company: { label: 'Company', icon: 'Building', description: 'All company users' },
  marketplace: { label: 'Marketplace', icon: 'Store', description: 'Listed in marketplace' },
  public: { label: 'Public API', icon: 'Globe', description: 'Accessible via API' },
};
