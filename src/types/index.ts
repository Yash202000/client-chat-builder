export interface Session {
  conversation_id: string;
  status: string;
  assignee_id?: number;
  last_message_timestamp: string;
}

export interface Agent {
  id: number;
  name: string;
  welcome_message: string;
  prompt: string;
  personality?: string;
  language?: string;
  timezone?: string;
  is_active?: boolean;
  credential_id?: number;
  knowledge_base_id?: number;
  tool_ids?: number[];
  version_number: number;
  parent_version_id?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  message: string;
  timestamp: string;
  sender: 'user' | 'agent' | 'tool';
  message_type: 'message' | 'note';
  agent_id: number;
  company_id: number;
  contact_id: number;
  status?: string;
  assignee_id?: number;
}

export interface Credential {
  id: number;
  name: string;
  platform: string;
  api_key: string;
}

export interface Webhook {
  id: number;
  agent_id: number;
  name: string;
  url: string;
  trigger_event: string;
  is_active: boolean;
}

export interface KnowledgeBase {
  id: number;
  name: string;
  description?: string;
  content: string;
}

export interface Tool {
  id: number;
  name: string;
  description?: string;
  parameters: any; // JSON schema
  code: string;
  configuration?: any;
}

export interface PreBuiltConnector {
  name: string;
  description: string;
  parameters: any; // JSON schema
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  company_id: number;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  job_title?: string;
  profile_picture_url?: string;
  role_id?: number;
  role?: Role;
  is_super_admin?: boolean;
  last_login_at?: string;
  subscription_plan_id?: number;
  subscription_status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
}

export interface Team {
  id: number;
  name: string;
  company_id: number;
  members: User[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Contact {
  id: number;
  email?: string;
  name?: string;
  phone_number?: string;
  custom_attributes?: Record<string, any>;
  company_id: number;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  currency: string;
  features?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OptimizationSuggestion {
  id: number;
  suggestion_type: string;
  description: string;
  agent_id?: number;
  company_id: number;
  details?: Record<string, any>;
  created_at: string;
}