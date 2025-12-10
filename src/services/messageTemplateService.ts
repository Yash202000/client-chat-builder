/**
 * Message Template Service
 *
 * API client for message templates (saved replies) with variable replacement.
 * Supports CRUD operations, search, usage tracking, and variable management.
 */

import { API_BASE_URL } from '@/config/api';

/**
 * Full message template interface
 */
export interface MessageTemplate {
  id: number;
  company_id: number;
  created_by_user_id: number;
  name: string;
  shortcut: string;
  content: string;
  tags: string[];
  scope: 'personal' | 'shared';
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Template search result for autocomplete
 */
export interface TemplateSearchResult {
  id: number;
  shortcut: string;
  name: string;
  content: string;
  preview: string;  // First 100 chars
  scope: string;
  tags: string[];
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  variable: string;
  description: string;
}

/**
 * Available variables response
 */
export interface AvailableVariables {
  contact_variables: TemplateVariable[];
  agent_variables: TemplateVariable[];
  system_variables: TemplateVariable[];
}

/**
 * Paginated template list response
 */
export interface TemplateListResponse {
  templates: MessageTemplate[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Template creation data
 */
export interface TemplateCreateData {
  name: string;
  shortcut: string;
  content: string;
  tags?: string[];
  scope?: 'personal' | 'shared';
}

/**
 * Template update data (all fields optional)
 */
export interface TemplateUpdateData {
  name?: string;
  shortcut?: string;
  content?: string;
  tags?: string[];
  scope?: 'personal' | 'shared';
}

/**
 * Get auth headers with token
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Search templates for slash command autocomplete
 *
 * @param query - Search query
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of template search results
 */
export async function searchTemplates(
  query: string,
  limit: number = 10
): Promise<TemplateSearchResult[]> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/message-templates/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to search templates');
      return [];
    }

    const results = await response.json();
    return results;
  } catch (error) {
    console.error('Error searching templates:', error);
    return [];
  }
}

/**
 * List all accessible templates with filtering and pagination
 *
 * @param params - Optional filter and pagination parameters
 * @returns Paginated list of templates
 */
export async function listTemplates(params?: {
  search?: string;
  tags?: string;
  scope?: string;
  page?: number;
  page_size?: number;
}): Promise<TemplateListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.search) queryParams.append('search', params.search);
  if (params?.tags) queryParams.append('tags', params.tags);
  if (params?.scope) queryParams.append('scope', params.scope);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/v1/message-templates?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }

  return response.json();
}

/**
 * Create a new template
 *
 * @param data - Template creation data
 * @returns Created template
 */
export async function createTemplate(
  data: TemplateCreateData
): Promise<MessageTemplate> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/message-templates`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create template');
  }

  return response.json();
}

/**
 * Get a specific template by ID
 *
 * @param id - Template ID
 * @returns Template data
 */
export async function getTemplate(id: number): Promise<MessageTemplate> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/message-templates/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch template');
  }

  return response.json();
}

/**
 * Update a template (only owner can update)
 *
 * @param id - Template ID
 * @param data - Update data
 * @returns Updated template
 */
export async function updateTemplate(
  id: number,
  data: TemplateUpdateData
): Promise<MessageTemplate> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/message-templates/${id}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update template');
  }

  return response.json();
}

/**
 * Delete a template (only owner can delete)
 *
 * @param id - Template ID
 */
export async function deleteTemplate(id: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/message-templates/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete template');
  }
}

/**
 * Track template usage (increment usage counter)
 *
 * @param templateId - Template ID
 */
export async function trackTemplateUsage(templateId: number): Promise<void> {
  await fetch(
    `${API_BASE_URL}/api/v1/message-templates/${templateId}/use`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    }
  );
  // Ignore errors for usage tracking (non-critical)
}

/**
 * Get list of available template variables
 *
 * @returns Available variables grouped by category
 */
export async function getAvailableVariables(): Promise<AvailableVariables> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/message-templates/variables/available`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch variables');
  }

  return response.json();
}

/**
 * Replace template variables with actual values
 *
 * Used when sending a message to replace {{contact_name}} with actual data.
 *
 * @param content - Content with {{variable}} placeholders
 * @param sessionId - Optional conversation session ID for contact context
 * @param agentId - Optional agent ID for agent context
 * @returns Content with variables replaced
 */
export async function replaceTemplateVariables(
  content: string,
  sessionId?: string,
  agentId?: number
): Promise<string> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/message-templates/replace-variables`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content,
          session_id: sessionId,
          agent_id: agentId,
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to replace template variables');
      return content; // Fallback to original
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error replacing template variables:', error);
    return content; // Fallback to original
  }
}
