
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Credential } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { Mic, MicOff, Sparkles, Loader2, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAgentDialog = ({ open, onOpenChange }: CreateAgentDialogProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const companyId = localStorage.getItem("companyId");

  const [description, setDescription] = useState("");
  const [credentialId, setCredentialId] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<Credential[]>({
    queryKey: ['credentials', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/credentials/`);
      if (!response.ok) throw new Error("Failed to fetch credentials");
      return response.json();
    }
  });

  // Auto-select first credential
  useEffect(() => {
    if (credentials?.length && !credentialId) {
      setCredentialId(String(credentials[0].id));
    }
  }, [credentials]);

  const generateAndCreateMutation = useMutation({
    mutationFn: async () => {
      if (!credentialId) throw new Error("Please select an API credential");
      if (!description.trim()) throw new Error("Please describe your agent");

      // Step 1: Generate config from description
      const genRes = await authFetch(`/api/v1/agents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), credential_id: parseInt(credentialId) }),
      });
      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.detail || "Failed to generate agent config");
      }
      const generated = await genRes.json();

      // Step 2: Create the agent with generated config
      const createRes = await authFetch(`/api/v1/agents/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generated.name,
          prompt: generated.prompt,
          welcome_message: generated.welcome_message,
          credential_id: parseInt(credentialId),
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create agent");
      return createRes.json();
    },
    onSuccess: (agent) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({ title: `${agent.name} created!`, description: "Opening builder..." });
      setDescription("");
      onOpenChange(false);
      navigate(`/dashboard/builder/${agent.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Mic not supported", description: "Your browser doesn't support voice input.", variant: "destructive" });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const placeholders = [
    "A customer support agent for an e-commerce store that helps with orders, returns, and product questions...",
    "A friendly HR assistant that answers employee questions about leave policies and benefits...",
    "A sales agent for a SaaS product that qualifies leads and books demos...",
  ];
  const placeholder = placeholders[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Create Agent</DialogTitle>
              <p className="text-sm text-muted-foreground">Describe what your agent should do</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Description input */}
          <div className="relative">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="resize-none pr-12 text-sm leading-relaxed"
              disabled={generateAndCreateMutation.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  generateAndCreateMutation.mutate();
                }
              }}
            />
            <button
              type="button"
              onClick={toggleMic}
              className={`absolute bottom-3 right-3 p-1.5 rounded-lg transition-all ${
                isListening
                  ? "bg-red-100 text-red-500 animate-pulse"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
              title={isListening ? "Stop listening" : "Speak to describe your agent"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {isListening && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Listening... speak now
            </p>
          )}

          {/* Credential selector */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select
                value={credentialId}
                onValueChange={setCredentialId}
                disabled={isLoadingCredentials || generateAndCreateMutation.isPending}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={isLoadingCredentials ? "Loading credentials..." : "Select AI credential"} />
                </SelectTrigger>
                <SelectContent>
                  {credentials?.map((cred) => (
                    <SelectItem key={cred.id} value={String(cred.id)}>
                      {cred.platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => generateAndCreateMutation.mutate()}
              disabled={!description.trim() || !credentialId || generateAndCreateMutation.isPending}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md shadow-emerald-500/25 h-9 px-4"
            >
              {generateAndCreateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            AI will generate the agent name, system prompt, and welcome message. Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono">⌘ Enter</kbd> to create.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
