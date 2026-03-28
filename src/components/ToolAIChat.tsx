import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send, Loader2, Bot, User, RotateCcw, ChevronDown, ChevronRight, Code, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ToolDef {
  id?: number;
  name: string;
  description: string;
  tool_type: string;
  parameters?: Record<string, any>;
  code?: string;
  follow_up_config?: Record<string, any> | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  tool?: ToolDef | null;
  stage?: string;
}

interface ToolAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  onToolCreated: () => void;
  editTool?: ToolDef | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const CREATE_PROMPTS = [
  "Send a welcome email via SendGrid",
  "Look up order status from Shopify",
  "Create a HubSpot contact",
  "Post a Slack notification",
];

const EDIT_PROMPTS = [
  "Change the API endpoint URL",
  "Add a timeout parameter",
  "Return a formatted string instead of raw JSON",
  "Add error handling for network failures",
  "Add a new input parameter",
];

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onCreateTool,
  onModify,
  isCreating,
  isEditMode,
}: {
  msg: ChatMessage;
  onCreateTool: (tool: ToolDef) => void;
  onModify: (msg: string) => void;
  isCreating: boolean;
  isEditMode: boolean;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-2.5 mb-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={cn("flex flex-col gap-2", isUser ? "items-end max-w-[85%]" : "items-start max-w-[90%]")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
              : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-600 rounded-bl-sm"
          )}
        >
          {msg.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
              <span className="opacity-70 text-xs">Thinking…</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>

        {/* Tool Preview Card */}
        {!msg.isLoading && msg.stage === "preview" && msg.tool && (
          <ToolPreviewCard
            tool={msg.tool}
            onCreateTool={onCreateTool}
            onModify={onModify}
            isCreating={isCreating}
            isEditMode={isEditMode}
          />
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center shadow-sm">
          <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
        </div>
      )}
    </div>
  );
}

// ── Tool Preview Card ─────────────────────────────────────────────────────────

function ToolPreviewCard({
  tool,
  onCreateTool,
  onModify,
  isCreating,
  isEditMode,
}: {
  tool: ToolDef;
  onCreateTool: (tool: ToolDef) => void;
  onModify: (msg: string) => void;
  isCreating: boolean;
  isEditMode: boolean;
}) {
  const [codeExpanded, setCodeExpanded] = useState(false);
  const params = tool.parameters?.properties
    ? Object.keys(tool.parameters.properties)
    : [];

  return (
    <div className="w-full rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="px-3.5 py-2.5 border-b border-violet-200 dark:border-violet-800 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Wrench className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono font-semibold text-violet-700 dark:text-violet-300 block truncate">
            {tool.name}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-300 text-violet-600 dark:border-violet-600 dark:text-violet-400 flex-shrink-0">
          custom
        </Badge>
      </div>

      {/* Description */}
      <div className="px-3.5 py-2">
        <p className="text-xs text-slate-600 dark:text-slate-300">{tool.description}</p>
      </div>

      {/* Parameters */}
      {params.length > 0 && (
        <div className="px-3.5 pb-2">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Parameters
          </p>
          <div className="flex flex-wrap gap-1">
            {params.map((p) => (
              <span
                key={p}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Code block */}
      {tool.code && (
        <div className="px-3.5 pb-2">
          <button
            onClick={() => setCodeExpanded(!codeExpanded)}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-1"
          >
            <Code className="w-3 h-3" />
            Code
            {codeExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {codeExpanded && (
            <pre className="text-[10px] font-mono bg-slate-900 text-green-300 rounded-lg p-2.5 overflow-x-auto max-h-40 overflow-y-auto leading-relaxed">
              {tool.code}
            </pre>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-3.5 pb-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => onCreateTool(tool)}
          disabled={isCreating}
          className="flex-1 h-8 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-sm shadow-violet-500/25"
        >
          {isCreating ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{isEditMode ? "Saving…" : "Creating…"}</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1.5" />{isEditMode ? "Save Changes" : "Create Tool"}</>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onModify("I'd like to modify this tool.")}
          disabled={isCreating}
          className="h-8 text-xs border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-900/30"
        >
          Modify
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ToolAIChat({ isOpen, onClose, onToolCreated, editTool }: ToolAIChatProps) {
  const isEditMode = !!editTool;
  const { authFetch } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened; clear history when target tool changes
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, editTool?.id]);

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || isSending) return;

    setInput("");
    setIsSending(true);

    const userMsg: ChatMessage = { id: uid(), role: "user", content: userText };
    const loadingMsg: ChatMessage = { id: uid(), role: "assistant", content: "", isLoading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    const history = messages
      .filter((m) => !m.isLoading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await authFetch("/api/v1/tools/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history,
          existing_tool: editTool ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "AI request failed");
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: data.reply,
        stage: data.stage,
        tool: data.tool ?? null,
      };
      setMessages((prev) => [...prev.filter((m) => !m.isLoading), assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: `⚠️ ${err.message ?? "Something went wrong. Please try again."}`,
      };
      setMessages((prev) => [...prev.filter((m) => !m.isLoading), errorMsg]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveTool = async (tool: ToolDef) => {
    setIsCreating(true);
    const toolId = editTool?.id;
    const url = toolId ? `/api/v1/tools/${toolId}` : "/api/v1/tools/";
    const method = toolId ? "PUT" : "POST";
    const action = toolId ? "updated" : "created";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tool, tool_type: "custom" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to ${action.replace("d", "")} tool`);
      }

      const successMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: `✅ Tool "${tool.name}" ${action} successfully!`,
      };
      setMessages((prev) => [...prev, successMsg]);

      onToolCreated();
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: `⚠️ Failed to save tool: ${err.message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-96 z-50 flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {isEditMode ? "Edit Tool with AI" : "AI Tool Builder"}
              </span>
              {isEditMode && (
                <p className="text-[10px] font-mono text-violet-500 dark:text-violet-400 truncate">
                  {editTool!.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Clear chat history"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4 shadow-sm">
                <Sparkles className="w-7 h-7 text-violet-500 dark:text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {isEditMode ? "What would you like to change?" : "AI Tool Builder"}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 max-w-[220px] leading-relaxed">
                {isEditMode
                  ? `Describe what you want to change in "${editTool!.name}" and I'll update the code.`
                  : "Describe the tool you want and I'll generate the code and configuration for you."}
              </p>
              <div className="w-full space-y-1.5">
                {(isEditMode ? EDIT_PROMPTS : CREATE_PROMPTS).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left text-[11px] px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300 hover:text-violet-700 dark:hover:border-violet-500 dark:hover:text-violet-300 transition-all hover:shadow-sm"
                  >
                    ✦ {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onCreateTool={saveTool}
                  onModify={sendMessage}
                  isCreating={isCreating}
                  isEditMode={isEditMode}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the tool you want to build… (Enter to send)"
              disabled={isSending}
              rows={2}
              className="flex-1 resize-none text-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all disabled:opacity-40"
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isSending}
              className="h-9 w-9 flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md shadow-violet-500/25 disabled:opacity-40 rounded-xl"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </>
  );
}
