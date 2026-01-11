export interface Session {
  conversation_id: string;
  status: string;
  assignee_id?: number;
  last_message_timestamp: string;
  channel: string;
  contact_name?: string;
  contact_phone?: string;
  is_client_connected?: boolean;
  reopen_count?: number;
  last_reopened_at?: string;
  resolved_at?: string;
  session_id?: string;
  first_message_content?: string;
  contact_identifier?: string;
  priority?: number; // 0=None, 1=Low, 2=Medium, 3=High, 4=Urgent
}

// Priority level constants
export const PRIORITY_LEVELS = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

export const PRIORITY_CONFIG: Record<number, { label: string; color: string; bgColor: string; borderColor: string }> = {
  0: { label: 'None', color: 'text-gray-500', bgColor: 'bg-gray-100', borderColor: 'border-l-gray-300' },
  1: { label: 'Low', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-l-blue-500' },
  2: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-l-yellow-500' },
  3: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-l-orange-500' },
  4: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-l-red-500' },
};

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
  handoff_team_id?: number;
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

export interface MessageAttachment {
  file_name?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
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
  attachments?: MessageAttachment[];
  options?: Array<{key: string; value: string}> | Array<string>;
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

export interface FollowUpFieldConfig {
  question: string;
  lookup_source?: string | null;
}

export interface FollowUpConfig {
  enabled: boolean;
  fields: Record<string, FollowUpFieldConfig>;
  completion_message?: string;
  completion_message_template?: string;
}

export interface Tool {
  id: number;
  name: string;
  description?: string;
  tool_type: "custom" | "mcp" | "builtin";
  parameters?: any; // JSON schema
  code?: string;
  mcp_server_url?: string;
  configuration?: any;
  is_pre_built?: boolean;
  company_id?: number | null; // null for global builtin tools
  follow_up_config?: FollowUpConfig | null;
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

// Entity Notes types
export type NoteType = 'note' | 'call' | 'meeting' | 'email' | 'task';

export interface EntityNote {
  id: number;
  company_id: number;
  contact_id?: number;
  lead_id?: number;
  note_type: NoteType;
  title?: string;
  content: string;
  activity_date?: string;
  duration_minutes?: number;
  participants?: string[];
  outcome?: string;
  created_by: number;
  creator_email?: string;
  created_at: string;
  updated_at: string;
}

export interface EntityNoteCreate {
  contact_id?: number;
  lead_id?: number;
  note_type: NoteType;
  title?: string;
  content: string;
  activity_date?: string;
  duration_minutes?: number;
  participants?: string[];
  outcome?: string;
}

export interface EntityNoteUpdate {
  note_type?: NoteType;
  title?: string;
  content?: string;
  activity_date?: string;
  duration_minutes?: number;
  participants?: string[];
  outcome?: string;
}

export interface EntityNoteList {
  notes: EntityNote[];
  total: number;
}

export const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: string; color: string; bgColor: string }> = {
  note: { label: 'Note', icon: 'FileText', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  call: { label: 'Call', icon: 'Phone', color: 'text-green-600', bgColor: 'bg-green-100' },
  meeting: { label: 'Meeting', icon: 'Calendar', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  email: { label: 'Email', icon: 'Mail', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  task: { label: 'Task', icon: 'CheckSquare', color: 'text-orange-600', bgColor: 'bg-orange-100' },
};

// API Channel Types
export interface ApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string;
  expires_at?: string;
  scopes?: string[];
  last_used_at?: string;
  is_active: boolean;
}

export interface ApiIntegration {
  id: number;
  name: string;
  description?: string;
  api_key_id: number;
  company_id: number;
  webhook_url?: string;
  webhook_secret?: string;
  webhook_enabled: boolean;
  sync_response: boolean;
  default_agent_id?: number;
  default_workflow_id?: number;
  rate_limit_requests?: number;
  rate_limit_window?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  api_key_name?: string;
  api_key_prefix?: string;
}

export interface ApiIntegrationCreate {
  name: string;
  description?: string;
  webhook_url?: string;
  webhook_secret?: string;
  webhook_enabled?: boolean;
  sync_response?: boolean;
  default_agent_id?: number;
  default_workflow_id?: number;
  rate_limit_requests?: number;
  rate_limit_window?: number;
}

export interface ApiIntegrationUpdate {
  name?: string;
  description?: string;
  webhook_url?: string;
  webhook_secret?: string;
  webhook_enabled?: boolean;
  sync_response?: boolean;
  default_agent_id?: number;
  default_workflow_id?: number;
  rate_limit_requests?: number;
  rate_limit_window?: number;
  is_active?: boolean;
}