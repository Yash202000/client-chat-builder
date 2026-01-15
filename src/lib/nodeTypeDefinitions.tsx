import {
  Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code,
  SquareStack, Globe, ClipboardList, Wrench,
  Target, Notebook, CheckCircle, Database, Tag, UserPlus, Activity,
  Zap, Wifi, Phone, Send, Instagram, Layers,
  Repeat, RefreshCw, PhoneCall, Server, PlayCircle, ArrowRightLeft,
  LucideIcon
} from 'lucide-react';
import React from 'react';

export type NodeCategory = 'triggers' | 'core' | 'chat' | 'tools';

export interface NodeTypeDefinition {
  type: string;
  label: string;
  icon: LucideIcon | React.FC<{ size?: number; className?: string }>;
  iconColor?: string;
  category: NodeCategory;
  defaultData: Record<string, any>;
}

// WhatsApp SVG icon component
export const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg className={className || "text-green-500"} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Telegram SVG icon component
export const TelegramIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg className={className || "text-sky-500"} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// Twilio SVG icon component
export const TwilioIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg className={className || "text-red-500"} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.381 0 0 5.381 0 12s5.381 12 12 12 12-5.381 12-12S18.619 0 12 0zm0 20.4c-4.636 0-8.4-3.764-8.4-8.4S7.364 3.6 12 3.6s8.4 3.764 8.4 8.4-3.764 8.4-8.4 8.4zm3.6-8.4c0 1.988-1.612 3.6-3.6 3.6S8.4 13.988 8.4 12 10.012 8.4 12 8.4s3.6 1.612 3.6 3.6z"/>
  </svg>
);

// FreeSWITCH SVG icon component
export const FreeSwitchIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg className={className || "text-purple-500"} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 0 0-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/>
  </svg>
);

// Trigger Nodes
export const TRIGGER_NODES: NodeTypeDefinition[] = [
  { type: 'start', label: 'Start', icon: PlayCircle, iconColor: 'text-emerald-500', category: 'triggers', defaultData: {} },
  { type: 'trigger_websocket', label: 'WebSocket', icon: Wifi, iconColor: 'text-blue-500', category: 'triggers', defaultData: {} },
  { type: 'trigger_whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, iconColor: 'text-green-500', category: 'triggers', defaultData: {} },
  { type: 'trigger_telegram', label: 'Telegram', icon: TelegramIcon, iconColor: 'text-sky-500', category: 'triggers', defaultData: {} },
  { type: 'trigger_instagram', label: 'Instagram', icon: Instagram, iconColor: 'text-pink-500', category: 'triggers', defaultData: {} },
  { type: 'trigger_twilio_voice', label: 'Twilio Voice', icon: TwilioIcon, iconColor: 'text-red-500', category: 'triggers', defaultData: {} },
  { type: 'trigger_freeswitch', label: 'FreeSWITCH', icon: FreeSwitchIcon, iconColor: 'text-purple-500', category: 'triggers', defaultData: {} },
];

// Core Nodes
export const CORE_NODES: NodeTypeDefinition[] = [
  { type: 'llm', label: 'LLM Prompt', icon: Bot, iconColor: 'text-indigo-500', category: 'core', defaultData: {} },
  { type: 'listen', label: 'Listen for Input', icon: Ear, iconColor: 'text-blue-500', category: 'core', defaultData: {} },
  { type: 'prompt', label: 'Prompt for Input', icon: HelpCircle, iconColor: 'text-amber-500', category: 'core', defaultData: {} },
  { type: 'form', label: 'Form', icon: ClipboardList, iconColor: 'text-teal-500', category: 'core', defaultData: {} },
  { type: 'condition', label: 'Condition', icon: GitBranch, iconColor: 'text-yellow-500', category: 'core', defaultData: {} },
  { type: 'knowledge', label: 'Knowledge Search', icon: BookOpen, iconColor: 'text-purple-500', category: 'core', defaultData: {} },
  { type: 'code', label: 'Code', icon: Code, iconColor: 'text-slate-500', category: 'core', defaultData: {} },
  { type: 'data_manipulation', label: 'Data Manipulation', icon: SquareStack, iconColor: 'text-orange-500', category: 'core', defaultData: {} },
  { type: 'http_request', label: 'HTTP Request', icon: Globe, iconColor: 'text-cyan-500', category: 'core', defaultData: {} },
  { type: 'extract_entities', label: 'Extract Entities', icon: Target, iconColor: 'text-rose-500', category: 'core', defaultData: {} },
  { type: 'subworkflow', label: 'Subworkflow', icon: Layers, iconColor: 'text-violet-500', category: 'core', defaultData: {} },
  { type: 'foreach_loop', label: 'For Each Loop', icon: Repeat, iconColor: 'text-green-500', category: 'core', defaultData: {} },
  { type: 'while_loop', label: 'While Loop', icon: RefreshCw, iconColor: 'text-lime-500', category: 'core', defaultData: {} },
  { type: 'update_context', label: 'Update Context', icon: Database, iconColor: 'text-blue-600', category: 'core', defaultData: {} },
  { type: 'response', label: 'Output', icon: MessageSquare, iconColor: 'text-green-600', category: 'core', defaultData: {} },
  { type: 'question_classifier', label: 'Question Classifier', icon: HelpCircle, iconColor: 'text-fuchsia-500', category: 'core', defaultData: {} },
];

// Chat-Specific Nodes
export const CHAT_NODES: NodeTypeDefinition[] = [
  { type: 'intent_router', label: 'Intent Router', icon: Target, iconColor: 'text-red-500', category: 'chat', defaultData: {} },
  { type: 'entity_collector', label: 'Collect Entities', icon: Notebook, iconColor: 'text-amber-500', category: 'chat', defaultData: {} },
  { type: 'check_entity', label: 'Check Entity', icon: CheckCircle, iconColor: 'text-emerald-500', category: 'chat', defaultData: {} },
  { type: 'tag_conversation', label: 'Tag Conversation', icon: Tag, iconColor: 'text-blue-500', category: 'chat', defaultData: {} },
  { type: 'assign_to_agent', label: 'Assign to Agent', icon: UserPlus, iconColor: 'text-purple-500', category: 'chat', defaultData: {} },
  { type: 'set_status', label: 'Set Status', icon: Activity, iconColor: 'text-orange-500', category: 'chat', defaultData: {} },
  { type: 'channel_redirect', label: 'Channel Redirect', icon: ArrowRightLeft, iconColor: 'text-cyan-500', category: 'chat', defaultData: {} },
];

// All static node definitions (excluding dynamic tools)
export const ALL_NODE_DEFINITIONS: NodeTypeDefinition[] = [
  ...TRIGGER_NODES,
  ...CORE_NODES,
  ...CHAT_NODES,
];

// Get node definition by type
export const getNodeDefinition = (type: string): NodeTypeDefinition | undefined => {
  return ALL_NODE_DEFINITIONS.find(node => node.type === type);
};

// Node categories for display
export const NODE_CATEGORIES = {
  triggers: { label: 'Triggers', nodes: TRIGGER_NODES },
  core: { label: 'Core Nodes', nodes: CORE_NODES },
  chat: { label: 'Chat & Conversation', nodes: CHAT_NODES },
};
