import axios from 'axios';

const API_BASE = '/api/v1/templates';

// Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

// Types
export interface Template {
  id: number;
  company_id: number;
  created_by_user_id?: number;
  name: string;
  description?: string;
  template_type: 'email' | 'sms' | 'whatsapp' | 'voice';
  subject?: string;
  body?: string;
  html_body?: string;
  design?: Record<string, any>;
  voice_script?: string;
  tts_voice_id?: string;
  whatsapp_template_name?: string;
  whatsapp_template_params?: Record<string, any>;
  personalization_tokens: string[];
  tags: string[];
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreate {
  name: string;
  description?: string;
  template_type: 'email' | 'sms' | 'whatsapp' | 'voice';
  subject?: string;
  body?: string;
  html_body?: string;
  design?: Record<string, any>;
  voice_script?: string;
  tts_voice_id?: string;
  whatsapp_template_name?: string;
  whatsapp_template_params?: Record<string, any>;
  personalization_tokens?: string[];
  tags?: string[];
  is_ai_generated?: boolean;
}

export interface TemplateUpdate extends Partial<TemplateCreate> {}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  page_size: number;
}

export interface AIGenerateRequest {
  credential_id: number;
  model?: string;
  template_type: 'email' | 'sms' | 'whatsapp' | 'voice';
  prompt: string;
  tone?: 'professional' | 'friendly' | 'casual' | 'formal' | 'persuasive';
  target_audience?: string;
  campaign_goal?: string;
  include_cta?: boolean;
  language?: string;
}

export interface AIGenerateResponse {
  subject?: string;
  body: string;
  html_body?: string;
  personalization_tokens: string[];
  suggestions?: string[];
}

export interface AISuggestSubjectsRequest {
  credential_id: number;
  model?: string;
  body: string;
  count?: number;
  tone?: string;
}

export interface AIImproveRequest {
  credential_id: number;
  model?: string;
  content: string;
  content_type: 'subject' | 'body' | 'html_body' | 'voice_script';
  improvements: string[];
}

export interface AIVariantsRequest {
  credential_id: number;
  model?: string;
  template_id: number;
  variant_count?: number;
  variation_type?: 'subject' | 'body' | 'both';
}

export interface AIProvider {
  service: string;
  name: string;
  models: { id: string; name: string }[];
  default_model: string;
}

// Template CRUD
export const getTemplates = async (params?: {
  search?: string;
  template_type?: string;
  tags?: string;
  page?: number;
  page_size?: number;
}): Promise<TemplateListResponse> => {
  const response = await axios.get(API_BASE, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const getTemplate = async (id: number): Promise<Template> => {
  const response = await axios.get(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createTemplate = async (data: TemplateCreate): Promise<Template> => {
  const response = await axios.post(API_BASE, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateTemplate = async (id: number, data: TemplateUpdate): Promise<Template> => {
  const response = await axios.put(`${API_BASE}/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
  });
};

export const duplicateTemplate = async (id: number, newName: string): Promise<Template> => {
  const response = await axios.post(`${API_BASE}/${id}/duplicate`, { new_name: newName }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// AI Generation
export const getAIProviders = async (): Promise<{ providers: AIProvider[] }> => {
  const response = await axios.get(`${API_BASE}/ai/providers`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const generateTemplate = async (request: AIGenerateRequest): Promise<AIGenerateResponse> => {
  const response = await axios.post(`${API_BASE}/ai/generate`, request, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const suggestSubjects = async (request: AISuggestSubjectsRequest): Promise<{ subjects: string[] }> => {
  const response = await axios.post(`${API_BASE}/ai/suggest-subjects`, request, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const improveContent = async (request: AIImproveRequest): Promise<{ improved_content: string; changes_made: string[] }> => {
  const response = await axios.post(`${API_BASE}/ai/improve`, request, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const generateVariants = async (request: AIVariantsRequest): Promise<{ variants: any[] }> => {
  const response = await axios.post(`${API_BASE}/ai/variants`, request, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Utility endpoints
export const getAvailableTypes = async (): Promise<{ types: { value: string; label: string; description: string }[] }> => {
  const response = await axios.get(`${API_BASE}/types/available`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getAvailableTokens = async (): Promise<{ tokens: { token: string; description: string }[] }> => {
  const response = await axios.get(`${API_BASE}/tokens/available`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
