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
}