export interface Session {
  conversation_id: string;
  status: string;
  assignee_id?: number;
  last_message_timestamp: string;
  channel: string;
  contact_name?: string;
  contact_phone?: string;
  is_client_connected?: boolean;
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
  model_name: string;
  llm_provider: string;
  embedding_model: string;
  tts_provider?: string;
  stt_provider?: string;
  voice_id?: string;
  company_id: number;
  default_assignee_id?: number;
  default_team_id?: number;
  default_contact_id?: number;
  auto_suggest_tools?: boolean;
  auto_suggest_knowledge_bases?: boolean;
  auto_suggest_contacts?: boolean;
  auto_close_sessions?: boolean;
  session_timeout_minutes?: number;
  credential_id?: number;
  knowledge_base_ids?: number[];
  tool_ids?: number[];
  version_number: number;
  parent_version_id?: number;
  status: string;
  created_at: string;
  updated_at: string;
  tools: Tool[];
  knowledge_bases?: KnowledgeBase[];
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
  tool_type: "custom" | "mcp";
  parameters?: any; // JSON schema
  code?: string;
  mcp_server_url?: string;
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
  presence_status?: string;
  last_seen?: string;
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

export interface NotificationSettings {
  id: number;
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  notification_types?: Record<string, boolean>;
}

export interface CompanySettings {
  id: number;
  company_id: number;
  setting_key: string;
  setting_value: string;
}

export interface WidgetSettings {
  id: number;
  agent_id: number;
  widget_title: string;
  widget_color: string;
  welcome_message: string;
  is_open_by_default: boolean;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
  custom_css?: string;
  custom_icon_url?: string;
  typing_indicator_enabled: boolean;
  response_delay_ms: number;
}