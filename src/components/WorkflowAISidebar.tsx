import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Sparkles, Settings2, Send, Loader2, Bot, User, RotateCcw, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import PropertiesPanel from "./PropertiesPanel";
import { Comments } from "./Comments";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  changedNodeIds?: string[];
  isLoading?: boolean;
}

interface WorkflowAISidebarProps {
  selectedNode: any;
  nodes: any[];
  edges: any[];
  setNodes: (nodes: any) => void;
  setEdges: (edges: any) => void;
  deleteNode: (id: string) => void;
  workflowId: string | undefined;
  workflowDbId: number | undefined;
  onNodesUpdated?: (changedIds: string[]) => void;
}

export interface WorkflowAISidebarHandle {
  switchToChat: () => void;
  switchToProperties: () => void;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const STARTER_PROMPTS = [
  "Add an LLM node that analyzes customer intent",
  "When user message comes in, collect their name and email",
  "Add a condition: if score > 80 send premium reply, else standard",
  "Add error handling to all LLM nodes",
  "Create a WhatsApp triggered welcome flow",
];

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-2 mb-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mt-0.5">
          <Bot className="w-3 h-3 text-violet-600 dark:text-violet-400" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
          isUser
            ? "bg-violet-500 text-white rounded-br-sm"
            : "bg-muted text-foreground border border-border rounded-bl-sm"
        )}
      >
        {msg.isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin opacity-60" />
            <span className="opacity-70 font-mono">Thinking…</span>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{msg.content}</p>
            {msg.changedNodeIds && msg.changedNodeIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {msg.changedNodeIds.map((id) => (
                  <span
                    key={id}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  >
                    {id}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center mt-0.5">
          <User className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const WorkflowAISidebar = forwardRef<WorkflowAISidebarHandle, WorkflowAISidebarProps>(
  (
    {
      selectedNode,
      nodes,
      edges,
      setNodes,
      setEdges,
      deleteNode,
      workflowId,
      workflowDbId,
      onNodesUpdated,
    },
    ref
  ) => {
    const { authFetch } = useAuth();
    const [activeTab, setActiveTab] = useState<"chat" | "properties">("chat");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Expose tab switching to parent
    useImperativeHandle(ref, () => ({
      switchToChat: () => setActiveTab("chat"),
      switchToProperties: () => setActiveTab("properties"),
    }));

    // Auto-switch to properties when a node is selected
    useEffect(() => {
      if (selectedNode) {
        setActiveTab("properties");
      }
    }, [selectedNode?.id]);

    const sendMessage = async (text?: string) => {
      const userText = (text ?? input).trim();
      if (!userText || isSending || !workflowDbId) return;

      setInput("");
      setIsSending(true);

      const userMsg: ChatMessage = { id: uid(), role: "user", content: userText };
      const loadingMsg: ChatMessage = { id: uid(), role: "assistant", content: "", isLoading: true };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);

      // Build history (exclude loading messages)
      const history = messages
        .filter((m) => !m.isLoading)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await authFetch(`/api/v1/workflows/${workflowDbId}/ai-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            current_visual_steps: { nodes, edges },
            history,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "AI request failed");
        }

        const data = await res.json();

        // Apply updated workflow to canvas
        if (data.visual_steps) {
          setNodes(data.visual_steps.nodes ?? nodes);
          setEdges(data.visual_steps.edges ?? edges);

          // Notify parent to flash changed nodes
          if (data.changed_node_ids?.length > 0 && onNodesUpdated) {
            onNodesUpdated(data.changed_node_ids);
          }
        }

        // Replace loading bubble with real reply
        const assistantMsg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content: data.reply,
          changedNodeIds: data.visual_steps ? data.changed_node_ids : undefined,
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

    const clearHistory = () => setMessages([]);

    // ── Render ──────────────────────────────────────────────────────────────

    return (
      <div className="h-full flex flex-col bg-card border-l border-border">

        {/* Tab bar */}
        <div className="flex-shrink-0 flex items-center border-b border-border px-2 pt-1.5 gap-0.5 bg-card">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all",
              activeTab === "chat"
                ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-b-0 border-violet-200 dark:border-violet-800"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab("properties")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all",
              activeTab === "properties"
                ? "bg-card text-foreground border border-b-0 border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Properties
            {selectedNode && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
            )}
          </button>
        </div>

        {/* ── AI CHAT TAB ── */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Workflow className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs font-semibold text-foreground font-mono">
                  Workflow Assistant
                </span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  title="Clear chat history"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-6">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground font-mono mb-1">
                    AI Workflow Assistant
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[200px] leading-relaxed">
                    Describe what you want to build or change and I'll update the canvas instantly.
                  </p>
                  <div className="w-full space-y-1">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        disabled={!workflowDbId}
                        className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:border-violet-400/50 dark:hover:border-violet-500/40 hover:text-foreground hover:bg-violet-50/30 dark:hover:bg-violet-950/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="text-violet-500 mr-1">›</span>{prompt}
                      </button>
                    ))}
                  </div>
                  {!workflowDbId && (
                    <p className="mt-3 text-[10px] text-violet-600 dark:text-violet-500 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 px-2.5 py-1.5 rounded-lg font-mono">
                      Save the workflow first to enable AI chat
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 p-3 border-t border-border bg-card">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    workflowDbId
                      ? "Describe a change… (Enter to send)"
                      : "Save workflow first to use AI chat"
                  }
                  disabled={isSending || !workflowDbId}
                  rows={2}
                  className="flex-1 resize-none text-xs rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 transition-all disabled:opacity-40"
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isSending || !workflowDbId}
                  className="h-9 w-9 flex-shrink-0 bg-violet-500 hover:bg-violet-600 text-white shadow-sm disabled:opacity-40 rounded-lg"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center font-mono">
                Shift+Enter for new line · Enter to send
              </p>
            </div>
          </div>
        )}

        {/* ── PROPERTIES TAB ── */}
        {activeTab === "properties" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
            <PropertiesPanel
              selectedNode={selectedNode}
              nodes={nodes}
              setNodes={setNodes}
              deleteNode={deleteNode}
              workflowId={workflowId}
            />
            {workflowDbId && <Comments workflowId={workflowDbId} />}
          </div>
        )}
      </div>
    );
  }
);

WorkflowAISidebar.displayName = "WorkflowAISidebar";
export default WorkflowAISidebar;
