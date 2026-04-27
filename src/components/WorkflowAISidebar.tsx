import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Sparkles, Settings2, Send, Loader2, Bot, User, RotateCcw, Workflow,
  Play, CheckCircle2, XCircle, AlertTriangle, SkipForward, Clock, Plus, Trash2,
  FlaskConical, ImagePlus, MapPin, X as XIcon,
} from "lucide-react";
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

interface SimStep {
  node_id: string;
  node_type: string;
  label: string;
  status: "success" | "error" | "warning" | "skipped" | "paused";
  output: string;
  duration_ms: number;
}

interface SimOption { key: string; value: string; }
interface SimFormField { name: string; label: string; type: string; required?: boolean; }

interface SimTurn {
  test_session_id: string;
  status: string;
  steps: SimStep[];
  total_duration_ms: number;
  response?: string;
  options?: SimOption[];
  allow_text_input?: boolean;
  form_title?: string;
  form_fields?: SimFormField[];
}

// One message bubble in the test chat
interface TestMsg {
  id: string;
  role: "user" | "bot";
  text: string;
  options?: SimOption[];
  allow_text_input?: boolean;
  form_fields?: SimFormField[];
  form_title?: string;
  isLoading?: boolean;
}

interface CtxVar {
  key: string;
  value: string;
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
  onNodesUpdated?: (changedIds: string[], simSteps?: Array<{ node_id: string; status: string }>) => void;
}

export interface WorkflowAISidebarHandle {
  switchToChat: () => void;
  switchToProperties: () => void;
  switchToTest: () => void;
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
    const [activeTab, setActiveTab] = useState<"chat" | "properties" | "test">("chat");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Test chat state
    const [testInput, setTestInput] = useState("");
    const [ctxVars, setCtxVars] = useState<CtxVar[]>([]);
    const [testMessages, setTestMessages] = useState<TestMsg[]>([]);
    const [testSessionId, setTestSessionId] = useState<string | null>(null);
    const [testStatus, setTestStatus] = useState<string>("idle");
    const [lastTurnSteps, setLastTurnSteps] = useState<SimStep[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [expandedStep, setExpandedStep] = useState<string | null>(null);
    const [showTrace, setShowTrace] = useState(false);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const testChatEndRef = useRef<HTMLDivElement>(null);

    // Attachment state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      testChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [testMessages]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Expose tab switching to parent
    useImperativeHandle(ref, () => ({
      switchToChat: () => setActiveTab("chat"),
      switchToProperties: () => setActiveTab("properties"),
      switchToTest: () => setActiveTab("test"),
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

    const uid = () => Math.random().toString(36).slice(2, 9);

    const fileToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const clearAttachments = () => {
      setSelectedFile(null);
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
      setSelectedLocation(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    };

    const handleLocationClick = () => {
      if (selectedLocation) { setSelectedLocation(null); return; }
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setIsGettingLocation(false);
        },
        () => {
          // fallback: Dubai
          setSelectedLocation({ latitude: 25.2048, longitude: 55.2708 });
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    const callSimulate = async (
      message: string,
      optionKey?: string,
      sessionId?: string | null,
      isFirst?: boolean,
      attachmentList?: Array<Record<string, any>>,
    ) => {
      if (!workflowDbId || isSimulating) return;
      setIsSimulating(true);
      setExpandedStep(null);

      const context: Record<string, string> = {};
      if (isFirst) ctxVars.forEach(({ key, value }) => { if (key.trim()) context[key.trim()] = value; });

      // Add loading bubble
      const loadingId = uid();
      setTestMessages(prev => [...prev, { id: loadingId, role: "bot", text: "", isLoading: true }]);

      try {
        const res = await authFetch(`/api/v1/workflows/${workflowDbId}/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            context: isFirst ? context : undefined,
            visual_steps: { nodes, edges },
            test_session_id: sessionId ?? null,
            option_key: optionKey ?? null,
            attachments: attachmentList?.length ? attachmentList : undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Simulation failed");
        }
        const data: SimTurn = await res.json();

        setTestSessionId(data.test_session_id);
        setTestStatus(data.status);
        setLastTurnSteps(data.steps);
        setFormValues({});

        // Replace loading bubble with real bot message
        const botMsg: TestMsg = {
          id: uid(),
          role: "bot",
          text: data.response || (data.status === "completed" ? "✓ Workflow completed." : ""),
          options: data.options,
          allow_text_input: data.allow_text_input,
          form_fields: data.form_fields,
          form_title: data.form_title,
        };
        setTestMessages(prev => [...prev.filter(m => m.id !== loadingId), botMsg]);

        // Animate canvas
        if (onNodesUpdated && data.steps.length > 0) {
          const valid = data.steps.filter(s => !s.node_id.startsWith("__"));
          onNodesUpdated(valid.map(s => s.node_id), valid.map(s => ({ node_id: s.node_id, status: s.status })));
        }

        // Reset session if workflow finished
        if (["completed", "error", "workflow_transferred"].includes(data.status)) {
          setTestSessionId(null);
        }
      } catch (err: any) {
        setTestMessages(prev => [
          ...prev.filter(m => m.id !== loadingId),
          { id: uid(), role: "bot", text: `⚠️ ${err.message ?? "Simulation failed"}` },
        ]);
        setTestStatus("error");
      } finally {
        setIsSimulating(false);
      }
    };

    const sendUserMessage = async (text: string, optionKey?: string) => {
      if (!text.trim() && !optionKey && !selectedFile && !selectedLocation) return;
      const isFirst = !testSessionId;

      // Build attachments
      const attachmentList: Array<Record<string, any>> = [];
      let previewUrl: string | null = filePreview;
      if (selectedFile) {
        const b64 = await fileToBase64(selectedFile);
        attachmentList.push({ file_name: selectedFile.name, file_type: selectedFile.type, file_size: selectedFile.size, file_data: b64 });
      }
      if (selectedLocation) {
        attachmentList.push({ file_name: "location", file_type: "application/geo+json", file_size: 0, location: selectedLocation });
      }

      // User bubble — show image thumb or location badge inline
      const userText = text || (selectedFile ? selectedFile.name : selectedLocation ? `📍 ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}` : "");
      setTestMessages(prev => [...prev, {
        id: uid(), role: "user", text: userText,
        attachmentPreview: previewUrl ?? undefined,
        locationPreview: selectedLocation ?? undefined,
      } as any]);

      setTestInput("");
      clearAttachments();
      callSimulate(optionKey ?? text, optionKey, testSessionId, isFirst, attachmentList);
    };

    const submitForm = () => {
      const lastMsg = testMessages[testMessages.length - 1];
      if (!lastMsg?.form_fields) return;
      const payload = JSON.stringify(formValues);
      setTestMessages(prev => [...prev, { id: uid(), role: "user", text: "📋 Form submitted" }]);
      callSimulate(payload, undefined, testSessionId, false);
    };

    const resetTestChat = () => {
      setTestMessages([]);
      setTestSessionId(null);
      setTestStatus("idle");
      setLastTurnSteps([]);
      setFormValues({});
      setExpandedStep(null);
      clearAttachments();
      if (onNodesUpdated) onNodesUpdated([], []);
    };

    const addCtxVar = () => setCtxVars((v) => [...v, { key: "", value: "" }]);
    const removeCtxVar = (i: number) => setCtxVars((v) => v.filter((_, idx) => idx !== i));
    const updateCtxVar = (i: number, field: "key" | "value", val: string) =>
      setCtxVars((v) => v.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

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
            AI
          </button>
          <button
            onClick={() => setActiveTab("test")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all",
              activeTab === "test"
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-b-0 border-emerald-200 dark:border-emerald-800"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Test
            {testMessages.length > 0 && (
              <span className={cn(
                "ml-1 w-1.5 h-1.5 rounded-full flex-shrink-0",
                testStatus === "error" ? "bg-red-500" :
                testStatus === "completed" ? "bg-emerald-500" : "bg-yellow-400 animate-pulse"
              )} />
            )}
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
            Props
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

        {/* ── TEST CHAT TAB ── */}
        {activeTab === "test" && (() => {
          const lastMsg = testMessages[testMessages.length - 1];
          const isWaitingForOptions = !lastMsg?.isLoading && lastMsg?.role === "bot" && (lastMsg.options?.length ?? 0) > 0 && !(lastMsg.allow_text_input);
          const isWaitingForForm = !lastMsg?.isLoading && lastMsg?.role === "bot" && (lastMsg.form_fields?.length ?? 0) > 0;
          const isIdle = testMessages.length === 0;
          const canType = !isSimulating && !!workflowDbId && !isWaitingForOptions && !isWaitingForForm;
          const canSend = canType && (!!testInput.trim() || !!selectedFile || !!selectedLocation);

          return (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Header bar */}
              <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", testSessionId ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
                  <span className="text-[10px] font-semibold text-muted-foreground font-mono uppercase tracking-wide">
                    {testSessionId ? "Session active" : "Test Chat"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {lastTurnSteps.length > 0 && (
                    <button
                      onClick={() => setShowTrace(t => !t)}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      {lastTurnSteps.filter(s => !s.node_id.startsWith("__")).length} nodes
                    </button>
                  )}
                  <button
                    onClick={resetTestChat}
                    title="Reset test chat"
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all",
                      testMessages.length > 0 || testSessionId
                        ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>
              </div>

              {/* Trace drawer (last turn) */}
              {showTrace && lastTurnSteps.length > 0 && (
                <div className="flex-shrink-0 border-b border-border bg-muted/30 max-h-40 overflow-y-auto p-2 space-y-1">
                  {lastTurnSteps.filter(s => !s.node_id.startsWith("__")).map((step, i) => {
                    const key = step.node_id + i;
                    const Icon = step.status === "success" ? CheckCircle2 : step.status === "error" ? XCircle : step.status === "warning" ? AlertTriangle : SkipForward;
                    const col = step.status === "success" ? "text-emerald-500" : step.status === "error" ? "text-red-500" : step.status === "warning" ? "text-amber-400" : "text-muted-foreground";
                    return (
                      <button key={key} onClick={() => setExpandedStep(expandedStep === key ? null : key)} className="w-full text-left">
                        <div className="flex items-center gap-1.5">
                          <Icon className={cn("w-3 h-3 flex-shrink-0", col)} />
                          <span className="text-[10px] font-semibold text-foreground truncate flex-1">{step.label}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{step.duration_ms}ms</span>
                        </div>
                        {expandedStep === key && (
                          <div className="ml-4.5 mt-1 text-[10px] text-foreground bg-card border border-border rounded p-1.5 whitespace-pre-wrap">
                            {step.output}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Context vars (only before chat starts) */}
              {isIdle && (
                <div className="flex-shrink-0 p-3 border-b border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Seed Context</span>
                    <button onClick={addCtxVar} className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                      <Plus className="w-2.5 h-2.5" /> Add
                    </button>
                  </div>
                  {ctxVars.map((v, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input value={v.key} onChange={e => updateCtxVar(i, "key", e.target.value)} placeholder="key"
                        className="flex-1 text-[10px] rounded border border-border bg-muted px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-0" />
                      <span className="text-[10px] text-muted-foreground">=</span>
                      <input value={v.value} onChange={e => updateCtxVar(i, "value", e.target.value)} placeholder="value"
                        className="flex-1 text-[10px] rounded border border-border bg-muted px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-0" />
                      <button onClick={() => removeCtxVar(i)} className="text-muted-foreground hover:text-red-500 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {!workflowDbId && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono text-center pt-1">Save the workflow first to enable testing</p>
                  )}
                </div>
              )}

              {/* Chat messages */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {isIdle && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
                      Type a message below to start testing your workflow — exactly like a real user would.
                    </p>
                  </div>
                )}

                {testMessages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "bot" && (
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                    <div className="max-w-[85%] space-y-1.5">
                      <div className={cn(
                        "rounded-xl px-3 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-emerald-500 text-white rounded-br-sm"
                          : "bg-muted text-foreground border border-border rounded-bl-sm"
                      )}>
                        {msg.isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin opacity-60" />
                            <span className="opacity-70 font-mono">Running…</span>
                          </div>
                        ) : (
                          <>
                            {(msg as any).attachmentPreview && (
                              <img src={(msg as any).attachmentPreview} alt="attachment" className="max-w-full rounded-lg mb-1.5 max-h-32 object-cover" />
                            )}
                            {(msg as any).locationPreview && (
                              <div className="flex items-center gap-1 text-[10px] mb-1 opacity-80">
                                <MapPin className="w-3 h-3" />
                                {(msg as any).locationPreview.latitude.toFixed(4)}, {(msg as any).locationPreview.longitude.toFixed(4)}
                              </div>
                            )}
                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                          </>
                        )}
                      </div>

                      {/* Option buttons */}
                      {msg.role === "bot" && !msg.isLoading && (msg.options?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-0.5">
                          {msg.options!.map((opt) => {
                            const isLast = msg.id === lastMsg?.id;
                            return (
                              <button
                                key={opt.key}
                                disabled={!isLast || isSimulating}
                                onClick={() => isLast && sendUserMessage(opt.value, opt.key)}
                                className={cn(
                                  "text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all",
                                  isLast && !isSimulating
                                    ? "border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer"
                                    : "border-border text-muted-foreground opacity-50 cursor-default"
                                )}
                              >
                                {opt.value}
                              </button>
                            );
                          })}
                          {msg.allow_text_input && msg.id === lastMsg?.id && (
                            <span className="text-[10px] text-muted-foreground self-center ml-1">or type below</span>
                          )}
                        </div>
                      )}

                      {/* Inline form */}
                      {msg.role === "bot" && !msg.isLoading && (msg.form_fields?.length ?? 0) > 0 && msg.id === lastMsg?.id && (
                        <div className="bg-card border border-border rounded-xl p-3 space-y-2 ml-0.5">
                          {msg.form_fields!.map((field) => (
                            <div key={field.name}>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                                {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
                              </label>
                              <input
                                type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                                value={formValues[field.name] ?? ""}
                                onChange={e => setFormValues(v => ({ ...v, [field.name]: e.target.value }))}
                                placeholder={field.label}
                                className="w-full text-xs rounded-lg border border-border bg-muted px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                              />
                            </div>
                          ))}
                          <button
                            onClick={submitForm}
                            disabled={isSimulating}
                            className="w-full mt-1 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-40 transition-all"
                          >
                            Submit
                          </button>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={testChatEndRef} />
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 border-t border-border bg-card">
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

                {isWaitingForForm ? (
                  <p className="text-[10px] text-center text-muted-foreground py-3">Fill in the form above and click Submit</p>
                ) : (
                  <div className="p-2 space-y-2">
                    {/* Attachment preview strip */}
                    {(selectedFile || selectedLocation) && (
                      <div className="flex items-center gap-2 px-1">
                        {selectedFile && filePreview && (
                          <div className="relative">
                            <img src={filePreview} alt="preview" className="h-14 w-14 rounded-lg object-cover border border-border" />
                            <button onClick={clearAttachments} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center">
                              <XIcon className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                        {selectedLocation && (
                          <div className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[10px] text-blue-700 dark:text-blue-300">
                            <MapPin className="w-3 h-3" />
                            {selectedLocation.latitude.toFixed(3)}, {selectedLocation.longitude.toFixed(3)}
                            <button onClick={() => setSelectedLocation(null)} className="ml-1 text-blue-500 hover:text-red-500">
                              <XIcon className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Textarea row */}
                    <div className="flex gap-1.5 items-end">
                      {/* Image attach */}
                      <button
                        onClick={() => canType && fileInputRef.current?.click()}
                        disabled={!canType || !!selectedFile}
                        title="Attach image"
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                          selectedFile ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-300 dark:border-emerald-700" : "bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-emerald-400 disabled:opacity-40"
                        )}
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                      </button>

                      {/* Location */}
                      <button
                        onClick={() => canType && handleLocationClick()}
                        disabled={!canType}
                        title={selectedLocation ? "Clear location" : "Share location"}
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                          selectedLocation ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 border border-blue-300 dark:border-blue-700" : "bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-blue-400 disabled:opacity-40"
                        )}
                      >
                        {isGettingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                      </button>

                      <textarea
                        value={testInput}
                        onChange={e => setTestInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (canSend) sendUserMessage(testInput);
                          }
                        }}
                        placeholder={
                          !workflowDbId ? "Save workflow first…" :
                          isWaitingForOptions ? "Select an option above" :
                          testMessages.length === 0 ? "Start the conversation…" :
                          "Reply…"
                        }
                        disabled={!canType}
                        rows={1}
                        className="flex-1 resize-none text-xs rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all disabled:opacity-40"
                      />

                      <button
                        onClick={() => canSend && sendUserMessage(testInput)}
                        disabled={!canSend}
                        className="h-8 w-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
                      >
                        {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
