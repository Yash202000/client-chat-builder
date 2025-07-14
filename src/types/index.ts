export interface Session {
  session_id: string;
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
}

export interface ChatMessage {
  id: number;
  session_id: string;
  message: string;
  timestamp: string;
  sender: string; // 'user' or 'agent' or 'tool'
  message_type: 'message' | 'note';
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
