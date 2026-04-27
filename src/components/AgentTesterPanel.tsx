import React, { useState, useRef, useEffect } from "react";
import {
  Bot, User, Send, Loader2, RotateCcw, FlaskConical,
  ImagePlus, MapPin, X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface ExecutionStep { node_id: string; status: string; }

interface AgentTesterPanelProps {
  agentId: number;
  agentName: string;
  onExecution?: (steps: ExecutionStep[]) => void;
}

interface MsgOption { key: string; value: string; }
interface FormField { name: string; label: string; type: string; required?: boolean; }

interface TestMsg {
  id: string;
  role: "user" | "bot";
  text: string;
  options?: MsgOption[];
  allow_text_input?: boolean;
  form_fields?: FormField[];
  form_title?: string;
  isLoading?: boolean;
  attachmentPreview?: string;
  locationPreview?: { latitude: number; longitude: number };
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const AgentTesterPanel: React.FC<AgentTesterPanelProps> = ({ agentId, agentName, onExecution }) => {
  const { authFetch } = useAuth();
  const [messages, setMessages] = useState<TestMsg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const clearTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearAttachments = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setSelectedLocation(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
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
        setSelectedLocation({ latitude: 25.2048, longitude: 55.2708 });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const sendMessage = async (text: string, optionKey?: string) => {
    const trimmed = text.trim();
    if (!trimmed && !optionKey && !selectedFile && !selectedLocation) return;
    if (isLoading) return;

    setIsLoading(true);

    // Cascade "running" onto chat-message then agent while waiting for response
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    onExecution?.([
      { node_id: 'chat-message-node', status: 'running' },
      { node_id: 'agent-node', status: 'running' },
    ]);  // handleExecution staggers these 350ms apart automatically

    // Build attachments
    const attachments: Array<Record<string, any>> = [];
    let previewUrl = filePreview;
    if (selectedFile) {
      const b64 = await fileToBase64(selectedFile);
      attachments.push({ file_name: selectedFile.name, file_type: selectedFile.type, file_size: selectedFile.size, file_data: b64 });
    }
    if (selectedLocation) {
      attachments.push({ file_name: "location", file_type: "application/geo+json", file_size: 0, location: selectedLocation });
    }

    const displayText = trimmed || (selectedFile ? selectedFile.name : selectedLocation
      ? `📍 ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}` : "");

    const userMsg: TestMsg = {
      id: uid(), role: "user", text: displayText,
      attachmentPreview: previewUrl ?? undefined,
      locationPreview: selectedLocation ?? undefined,
    };
    const loadingId = uid();
    const loadingMsg: TestMsg = { id: loadingId, role: "bot", text: "", isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput("");
    clearAttachments();

    try {
      const res = await authFetch("/api/v1/ai-chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed || displayText,
          conversation_id: conversationId ?? undefined,
          agent_id: agentId,
          option_key: optionKey ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Agent request failed");
      }

      const data = await res.json();

      // Persist conversation_id for multi-turn sessions
      if (data.conversation_id) setConversationId(data.conversation_id);

      // Animate nodes: success state
      const steps: ExecutionStep[] = data.execution_steps?.length
        ? data.execution_steps
        : [{ node_id: 'chat-message-node', status: 'success' }, { node_id: 'agent-node', status: 'success' }];
      onExecution?.(steps);
      clearTimerRef.current = setTimeout(() => onExecution?.([]), 3000);

      setFormValues({});

      const botMsg: TestMsg = {
        id: uid(),
        role: "bot",
        text: data.message || "",
        options: data.options?.length ? data.options : undefined,
        allow_text_input: data.message_type === "prompt" ? true : undefined,
        form_fields: data.message_type === "form" && data.options?.length
          ? data.options.map((o: any) => ({ name: o.key, label: o.value, type: "text", required: false }))
          : undefined,
      };

      setMessages(prev => [...prev.filter(m => m.id !== loadingId), botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev.filter(m => m.id !== loadingId),
        { id: uid(), role: "bot", text: `⚠️ ${err.message ?? "Something went wrong"}` },
      ]);
      onExecution?.([{ node_id: 'agent-node', status: 'error' }, { node_id: 'chat-message-node', status: 'error' }]);
      clearTimerRef.current = setTimeout(() => onExecution?.([]), 3000);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const submitForm = () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.form_fields) return;
    const payload = JSON.stringify(formValues);
    setMessages(prev => [...prev, { id: uid(), role: "user", text: "📋 Form submitted" }]);
    sendMessage(payload);
  };

  const reset = () => {
    setMessages([]);
    setConversationId(null);
    setFormValues({});
    clearAttachments();
    setInput("");
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    onExecution?.([]);
  };

  const lastMsg = messages[messages.length - 1];
  const isWaitingForOptions = !lastMsg?.isLoading && lastMsg?.role === "bot" && (lastMsg.options?.length ?? 0) > 0 && !lastMsg.allow_text_input;
  const isWaitingForForm = !lastMsg?.isLoading && lastMsg?.role === "bot" && (lastMsg.form_fields?.length ?? 0) > 0;
  const canType = !isLoading && !isWaitingForOptions && !isWaitingForForm;
  const canSend = canType && (!!input.trim() || !!selectedFile || !!selectedLocation);
  const isIdle = messages.length === 0;

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            conversationId ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
          )} />
          <span className="text-[10px] font-semibold text-muted-foreground font-mono uppercase tracking-wide">
            {conversationId ? "Session active" : "Agent Tester"}
          </span>
        </div>
        <button
          onClick={reset}
          title="Reset conversation"
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all",
            messages.length > 0 || conversationId
              ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {isIdle && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground font-mono mb-1">{agentName}</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
                Send a message to test this agent exactly like a real user would.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
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
                    <span className="opacity-70 font-mono">Thinking…</span>
                  </div>
                ) : (
                  <>
                    {msg.attachmentPreview && (
                      <img src={msg.attachmentPreview} alt="attachment" className="max-w-full rounded-lg mb-1.5 max-h-32 object-cover" />
                    )}
                    {msg.locationPreview && (
                      <div className="flex items-center gap-1 text-[10px] mb-1 opacity-80">
                        <MapPin className="w-3 h-3" />
                        {msg.locationPreview.latitude.toFixed(4)}, {msg.locationPreview.longitude.toFixed(4)}
                      </div>
                    )}
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  </>
                )}
              </div>

              {/* Option pills */}
              {msg.role === "bot" && !msg.isLoading && (msg.options?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-0.5">
                  {msg.options!.map((opt) => {
                    const isLast = msg.id === lastMsg?.id;
                    return (
                      <button
                        key={opt.key}
                        disabled={!isLast || isLoading}
                        onClick={() => isLast && sendMessage(opt.value, opt.key)}
                        className={cn(
                          "text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all",
                          isLast && !isLoading
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
                  {msg.form_title && (
                    <p className="text-[10px] font-semibold text-foreground mb-1">{msg.form_title}</p>
                  )}
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
                    disabled={isLoading}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-card">
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
                    <button
                      onClick={() => { setSelectedFile(null); if (filePreview) URL.revokeObjectURL(filePreview); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <XIcon className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                {selectedLocation && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[10px] text-blue-700 dark:text-blue-300">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedLocation.latitude.toFixed(3)}, {selectedLocation.longitude.toFixed(3)}</span>
                    <button onClick={() => setSelectedLocation(null)} className="ml-1 text-blue-400 hover:text-blue-600">
                      <XIcon className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-1.5 items-end">
              {/* Attachment buttons */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!canType || !!selectedFile}
                title="Attach image"
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center transition-all",
                  selectedFile
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground hover:border-emerald-400 disabled:opacity-40"
                )}
              >
                <ImagePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLocationClick}
                disabled={!canType || isGettingLocation}
                title={selectedLocation ? "Remove location" : "Share location"}
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center transition-all",
                  selectedLocation
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground hover:border-blue-400 disabled:opacity-40"
                )}
              >
                {isGettingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                }}
                placeholder={isWaitingForOptions ? "Select an option above…" : "Message the agent…"}
                disabled={!canType}
                rows={1}
                className="flex-1 resize-none text-xs rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all disabled:opacity-40"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 transition-all"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentTesterPanel;
