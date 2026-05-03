import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, User, Contact, PRIORITY_CONFIG, MessageAttachment } from '@/types';
import { Paperclip, Send, CornerDownRight, Book, CheckCircle, Users, Video, Bot, Mic, MessageSquare, Sparkles, ArrowLeft, AlertTriangle, ArrowUp, Minus, ArrowDown, Flag, FileText, Download, MapPin, Image, File, Clock, Loader2, ChevronUp, User as UserIcon, Phone, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { useTwilioCall } from '@/contexts/TwilioCallContext';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { ConversationSidebar } from './ConversationSidebar';
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Label } from './ui/label';
import { useVoiceConnection } from '@/hooks/use-voice-connection';
import { getWebSocketUrl } from '@/config/api';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import FileUpload from './FileUpload';
import { uploadConversationFile } from '@/services/chatService';
import RichTextEditor, { RichTextEditorHandle } from './RichTextEditor';
import EmojiPicker from './EmojiPicker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { replaceTemplateVariables } from '@/services/messageTemplateService';

// Animation variants for Framer Motion
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1
    }
  }
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

// Message Skeleton for loading state
const MessageSkeleton = ({ isUser = false }: { isUser?: boolean }) => (
  <div className={`flex items-end gap-2.5 ${isUser ? 'justify-start' : 'justify-end'}`}>
    {isUser && (
      <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center opacity-60 flex-shrink-0">
        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    )}
    <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} max-w-[85%] sm:max-w-[60%]`}>
      <div className={`rounded-2xl px-3.5 py-2.5 animate-pulse bg-muted ${isUser ? 'rounded-bl-md' : 'rounded-br-md'}`}>
        <div className="h-3.5 w-32 rounded bg-muted-foreground/20 mb-2" />
        <div className="h-3.5 w-48 rounded bg-muted-foreground/20" />
      </div>
      <div className="h-2.5 w-14 rounded bg-muted animate-pulse mt-1.5" />
    </div>
    {!isUser && (
      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center opacity-60 flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
    )}
  </div>
);

interface ConversationDetailProps {
  sessionId: string;
  agentId: number;
  readOnly?: boolean;
  onBack?: () => void;
  onSummaryClick?: () => void;
  onContactClick?: () => void;
}

// Utility function to format date for separator
const formatDateSeparator = (date: Date, locale?: string): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);

  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  messageDate.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    // Check if message is from this week (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (messageDate >= weekAgo) {
      // Show day of week for messages within last week
      return messageDate.toLocaleDateString(locale, { weekday: 'long' });
    } else {
      // Format as "December 25, 2024" or localized format
      return messageDate.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
};

// Check if two messages are from different days
const isDifferentDay = (date1: string | Date, date2: string | Date): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return d1.getDate() !== d2.getDate() ||
         d1.getMonth() !== d2.getMonth() ||
         d1.getFullYear() !== d2.getFullYear();
};

// Use MessageAttachment from types

// Helper to format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper to check if file is an image
const isImageFile = (fileType?: string): boolean => {
  return fileType?.startsWith('image/') || false;
};

// Attachment renderer component
const AttachmentDisplay: React.FC<{ attachments: MessageAttachment[], sender: string }> = ({ attachments, sender }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((att, index) => {
        // Location attachment
        if (att.location) {
          const { latitude, longitude } = att.location;
          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          return (
            <a
              key={index}
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                sender === 'user'
                  ? 'bg-muted hover:bg-muted/80'
                  : 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
              }`}
            >
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                📍 Location ({latitude.toFixed(4)}, {longitude.toFixed(4)})
              </span>
            </a>
          );
        }

        // File attachment
        const hasDownload = att.file_url;

        // Image preview for image files
        if (isImageFile(att.file_type) && att.file_url) {
          return (
            <div key={index} className="space-y-1">
              <a
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={att.file_url}
                  alt={att.file_name || 'Image'}
                  className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-slate-200 dark:border-slate-600"
                />
              </a>
              <div className={`flex items-center gap-2 text-xs ${
                sender === 'user' ? 'text-muted-foreground' : 'text-primary-foreground/80'
              }`}>
                <Image className="h-3 w-3" />
                <span>{att.file_name}</span>
                {att.file_size && <span>({formatFileSize(att.file_size)})</span>}
                {hasDownload && (
                  <a
                    href={att.file_url}
                    download={att.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                      sender === 'user'
                        ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                        : 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
                    }`}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </a>
                )}
              </div>
            </div>
          );
        }

        // Non-image file attachment
        return (
          <div
            key={index}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              sender === 'user'
                ? 'bg-muted'
                : 'bg-primary-foreground/10'
            }`}
          >
            <File className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm truncate block">{att.file_name || 'File'}</span>
              {att.file_size && (
                <span className={`text-xs ${
                  sender === 'user' ? 'text-muted-foreground' : 'text-primary-foreground/70'
                }`}>
                  {formatFileSize(att.file_size)}
                </span>
              )}
            </div>
            {hasDownload && (
              <a
                href={att.file_url}
                download={att.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  sender === 'user'
                    ? 'bg-primary/10 hover:bg-primary/20 text-primary'
                    : 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
                }`}
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

// localStorage keys for draft auto-save
const getDraftKey = (sessionId: string, type: 'message' | 'note') => `draft_${type}_${sessionId}`;

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ sessionId, agentId, readOnly = false, onBack, onSummaryClick, onContactClick }) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { playSuccessSound } = useNotifications();
  const companyId = 1; // Hardcoded company ID
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const { startCall: startVideoCall } = useVideoCall();
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [activeComposerTab, setActiveComposerTab] = useState<'reply' | 'note'>('reply');
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const currentSessionIdRef = useRef(sessionId);
  const isInitialLoadRef = useRef(true);
  const isLoadingDraftRef = useRef(false);
  const messageRef = useRef(message);
  const noteRef = useRef(note);

  // Keep refs in sync with state
  useEffect(() => {
    console.log('[Draft] Syncing refs - message:', message, 'note:', note);
    messageRef.current = message;
    noteRef.current = note;
  }, [message, note]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isNearBottomRef = useRef(true);
  const replyEditorRef = useRef<RichTextEditorHandle | null>(null);
  const noteEditorRef = useRef<RichTextEditorHandle | null>(null);
  const previousScrollHeight = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { authFetch, token } = useAuth();
  const { makeCall, callState } = useTwilioCall();
  const { isRecording, startRecording, stopRecording } = useVoiceConnection(agentId, sessionId);

  // Load drafts from localStorage when session changes
  useEffect(() => {
    if (readOnly) return;

    console.log('[Draft] Session changed to:', sessionId);
    console.log('[Draft] Previous session:', currentSessionIdRef.current);
    console.log('[Draft] isInitialLoad:', isInitialLoadRef.current);
    console.log('[Draft] messageRef.current:', messageRef.current);

    // Set loading flag
    isLoadingDraftRef.current = true;

    // Save draft for previous session before switching (if not initial load)
    if (!isInitialLoadRef.current && currentSessionIdRef.current !== sessionId) {
      const prevSessionId = currentSessionIdRef.current;
      // Use refs to get the latest values
      const currentMessage = messageRef.current;
      const currentNote = noteRef.current;

      console.log('[Draft] Saving to previous session:', prevSessionId);
      console.log('[Draft] Message to save:', currentMessage);

      if (currentMessage.trim()) {
        localStorage.setItem(getDraftKey(prevSessionId, 'message'), currentMessage);
        console.log('[Draft] Saved message to localStorage:', getDraftKey(prevSessionId, 'message'));
      }
      if (currentNote.trim()) {
        localStorage.setItem(getDraftKey(prevSessionId, 'note'), currentNote);
      }
    }

    // Update current session ref
    currentSessionIdRef.current = sessionId;
    isInitialLoadRef.current = false;

    // Load drafts for new session
    const savedMessage = localStorage.getItem(getDraftKey(sessionId, 'message')) || '';
    const savedNote = localStorage.getItem(getDraftKey(sessionId, 'note')) || '';

    console.log('[Draft] Loading from session:', sessionId);
    console.log('[Draft] Loaded message:', savedMessage);
    console.log('[Draft] localStorage key:', getDraftKey(sessionId, 'message'));

    // Update refs immediately to prevent stale data issues
    messageRef.current = savedMessage;
    noteRef.current = savedNote;

    setMessage(savedMessage);
    setNote(savedNote);
    setHasDraft(!!savedMessage || !!savedNote);

    // Reset loading flag after state updates
    setTimeout(() => {
      isLoadingDraftRef.current = false;
      console.log('[Draft] Loading flag reset');
    }, 100);
  }, [sessionId, readOnly]);

  // Auto-save drafts to localStorage with debounce (only when user types)
  useEffect(() => {
    if (readOnly) return;

    // Skip auto-save while loading drafts
    if (isLoadingDraftRef.current) {
      console.log('[Draft] Auto-save skipped - loading in progress');
      return;
    }

    // Clear previous timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    // Debounce save to avoid too many writes
    draftSaveTimeoutRef.current = setTimeout(() => {
      // Double-check loading flag
      if (isLoadingDraftRef.current) {
        console.log('[Draft] Auto-save skipped in timeout - loading in progress');
        return;
      }

      // Only save for current session
      const saveSessionId = currentSessionIdRef.current;

      console.log('[Draft] Auto-saving to session:', saveSessionId);
      console.log('[Draft] Message:', message);

      if (message.trim()) {
        localStorage.setItem(getDraftKey(saveSessionId, 'message'), message);
        console.log('[Draft] Auto-saved message');
      } else {
        localStorage.removeItem(getDraftKey(saveSessionId, 'message'));
        console.log('[Draft] Removed empty message from localStorage');
      }

      if (note.trim()) {
        localStorage.setItem(getDraftKey(saveSessionId, 'note'), note);
      } else {
        localStorage.removeItem(getDraftKey(saveSessionId, 'note'));
      }

      setHasDraft(!!message.trim() || !!note.trim());
    }, 500);

    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [message, note, readOnly]);

  // Clear drafts helper function
  const clearDraft = (type: 'message' | 'note' | 'all') => {
    const saveSessionId = currentSessionIdRef.current;

    if (type === 'message' || type === 'all') {
      localStorage.removeItem(getDraftKey(saveSessionId, 'message'));
    }
    if (type === 'note' || type === 'all') {
      localStorage.removeItem(getDraftKey(saveSessionId, 'note'));
    }

    const remainingMessage = type === 'message' || type === 'all' ? '' : message;
    const remainingNote = type === 'note' || type === 'all' ? '' : note;
    setHasDraft(!!remainingMessage.trim() || !!remainingNote.trim());
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const { data: sessionDetails } = useQuery({
    queryKey: ['sessionDetails', sessionId],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/conversations/${agentId}/sessions/${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error('Failed to fetch session details');
      return res.json();
    },
    enabled: !!sessionId,
  });

  // Update isAiEnabled when sessionDetails changes
  useEffect(() => {
    if (sessionDetails?.is_ai_enabled !== undefined) {
      setIsAiEnabled(sessionDetails.is_ai_enabled);
    }
  }, [sessionDetails?.is_ai_enabled]);

  const toggleAiMutation = useMutation({
    mutationFn: (enabled: boolean) => authFetch(`/api/v1/conversations/${encodeURIComponent(sessionId)}/toggle-ai`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_ai_enabled: enabled }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update AI status'); return res.json() }),
    onSuccess: (data) => {
      setIsAiEnabled(data.is_ai_enabled);
      queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
      toast({
        title: t('conversations.detail.toasts.success'),
        description: data.is_ai_enabled ? t('conversations.detail.toasts.aiEnabled') : t('conversations.detail.toasts.aiDisabled'),
        variant: 'success'
      });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<ChatMessage[]>({
    queryKey: ['messages', agentId, sessionId, companyId],
    queryFn: async ({ pageParam }) => {
      const encodedSessionId = encodeURIComponent(sessionId);
      const url = pageParam
        ? `/api/v1/conversations/${agentId}/${encodedSessionId}?limit=20&before_id=${pageParam}`
        : `/api/v1/conversations/${agentId}/${encodedSessionId}?limit=20`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      // Return the ID of the oldest message for cursor-based pagination
      // If we got fewer messages than requested, we've reached the end
      if (lastPage && lastPage.length === 20) {
        return lastPage[0].id; // First message is the oldest
      }
      return undefined; // No more pages
    },
    initialPageParam: undefined,
    enabled: !!sessionId && !!agentId,
  });

  // Flatten all pages into a single messages array
  // Pages are ordered: [latest messages, older messages, even older messages...]
  // We need to reverse the pages array so oldest messages appear first (top) and newest last (bottom)
  const messages = messagesData?.pages ? [...messagesData.pages].reverse().flat() : [];

  useEffect(() => {
    // Skip WebSocket connection in read-only mode
    if (readOnly) return;
    if (!sessionId || !agentId || !token) return;

    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

      ws.current = new WebSocket(`${getWebSocketUrl()}/api/v1/ws/${agentId}/${sessionId}?user_type=agent&token=${token}`);

      ws.current.onopen = () => {
        reconnectAttemptRef.current = 0;
        console.log('[WebSocket] Connected');
      };

      ws.current.onmessage = (event) => {
        const rawMessage = JSON.parse(event.data);

        // Filter out ping/pong messages
        if (rawMessage.type === 'ping' || rawMessage.type === 'pong') {
          return;
        }

        // Handle contact update messages
        if (rawMessage.type === 'contact_updated') {
          console.log('[WebSocket] Contact updated:', rawMessage);
          queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
          return;
        }

        // Unwrap message if it's wrapped in { type: "message", message: {...} }
        const newMessage = rawMessage.type === 'message' && rawMessage.message ? rawMessage.message : rawMessage;

        // Filter out ephemeral messages - typing indicators and tool-use events
        if (newMessage.message_type === 'typing' || newMessage.message_type === 'tool_use') {
          return;
        }

        queryClient.setQueryData(['messages', agentId, sessionId, companyId], (oldData: any) => {
          if (!oldData) return { pages: [[newMessage]], pageParams: [undefined] };

          const lastPage = oldData.pages[oldData.pages.length - 1];
          if (lastPage?.some((msg: ChatMessage) => msg.id === newMessage.id)) {
            return oldData;
          }

          const newPages = [...oldData.pages];
          newPages[newPages.length - 1] = [...lastPage, newMessage];

          return { ...oldData, pages: newPages };
        });
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };

      ws.current.onclose = (event) => {
        if (destroyed) return;
        if (!event.wasClean) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, 30000);
          console.log(`[WebSocket] Disconnected — reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);
          reconnectAttemptRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      ws.current?.close();
    };
  }, [sessionId, agentId, companyId, queryClient, token, readOnly]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: () => authFetch(`/api/v1/users/`).then(res => res.json()),
  });

  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Reset initial load flag and jump to bottom placeholder when session changes
  useEffect(() => {
    setHasInitiallyLoaded(false);
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [sessionId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !hasInitiallyLoaded) {
      const doScroll = () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
        } else if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        setHasInitiallyLoaded(true);
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doScroll();
        });
      });
      const fallback = setTimeout(doScroll, 150);
      return () => clearTimeout(fallback);
    }
  }, [isLoading, messages.length, hasInitiallyLoaded]);

  // Scroll to bottom when new messages arrive (only if user was near the bottom before the message rendered)
  useEffect(() => {
    if (!hasInitiallyLoaded) return;
    if (!isNearBottomRef.current) return;

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages, hasInitiallyLoaded]);

  // Handle scroll to load more messages (only after initial load)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasInitiallyLoaded) return;

    const handleScroll = () => {
      // Track whether user is near the bottom so new-message auto-scroll knows what to do
      isNearBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

      // Check if user has scrolled to top (within 100px from top)
      if (container.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
        console.log('[Scroll] Loading more messages...', { scrollTop: container.scrollTop, hasNextPage, isFetchingNextPage });
        const scrollHeightBefore = container.scrollHeight;
        const scrollTopBefore = container.scrollTop;

        fetchNextPage().then(() => {
          // Maintain scroll position after loading older messages
          requestAnimationFrame(() => {
            if (container) {
              const scrollHeightAfter = container.scrollHeight;
              const newScrollTop = scrollTopBefore + (scrollHeightAfter - scrollHeightBefore);
              container.scrollTop = newScrollTop;
              console.log('[Scroll] Loaded older messages, adjusted scroll position');
            }
          });
        });
      }
    };

    container.addEventListener('scroll', handleScroll);
    console.log('[Scroll] Scroll listener attached', { hasInitiallyLoaded, hasNextPage });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      console.log('[Scroll] Scroll listener removed');
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, hasInitiallyLoaded]);

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage: { message: string, message_type: string, sender: string, token?: string }) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(newMessage));
            return Promise.resolve(newMessage.message_type);
        }
        return Promise.reject(new Error("WebSocket is not connected."));
    },
    onSuccess: (messageType) => {
        if (messageType === 'note') {
          setNote('');
          clearDraft('note');
        } else {
          setMessage('');
          clearDraft('message');
        }
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => authFetch(`/api/v1/conversations/${encodeURIComponent(sessionId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
      toast({
        title: t('conversations.detail.toasts.statusUpdated'),
        description: t('conversations.detail.toasts.statusUpdatedDesc'),
        variant: 'success'
      });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const startCallMutation = useMutation({
    mutationFn: async () => {
      const tokenResponse = await authFetch(`/api/v1/calls/token?session_id=${encodeURIComponent(sessionId)}&user_id=${encodeURIComponent(sessionId)}`);
      if (!tokenResponse.ok) throw new Error('Failed to get video call token');
      const tokenData = await tokenResponse.json();
      await authFetch(`/api/v1/calls/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      return tokenData.token;
    },
    onSuccess: (userToken) => {
      startVideoCall({
        sessionId,
        userId: 'agent',
        conversationSessionId: sessionId,
        conversationAgentId: agentId,
      });
      sendMessageMutation.mutate({
        message: t('conversations.detail.videoCallMessage'),
        message_type: 'video_call_invitation',
        sender: 'agent',
        token: userToken,
      });
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const assigneeMutation = useMutation({
    mutationFn: (newAssigneeId: number) => authFetch(`/api/v1/conversations/${encodeURIComponent(sessionId)}/assignee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: newAssigneeId }),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
      toast({
        title: t('conversations.detail.toasts.assignmentUpdated'),
        description: t('conversations.detail.toasts.assignmentUpdatedDesc'),
        variant: 'success'
      });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const priorityMutation = useMutation({
    mutationFn: (newPriority: number) => authFetch(`/api/v1/conversations/${encodeURIComponent(sessionId)}/priority`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ priority: newPriority }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update priority'); return res.json(); }),
    onSuccess: (_, newPriority) => {
      // Optimistically update sessionDetails cache immediately so UI reflects change
      queryClient.setQueryData(['sessionDetails', sessionId], (oldData: any) => {
        if (oldData) {
          return { ...oldData, priority: newPriority };
        }
        return oldData;
      });
      // Invalidate session lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
      toast({
        title: t('conversations.priority.updated', { defaultValue: 'Priority updated' }),
        description: t('conversations.priority.updatedDesc', { defaultValue: 'Conversation priority has been updated' }),
        variant: 'success'
      });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const getPriorityIcon = (priority: number) => {
    switch (priority) {
      case 4: return <AlertTriangle className="h-3 w-3" />;
      case 3: return <ArrowUp className="h-3 w-3" />;
      case 2: return <Minus className="h-3 w-3" />;
      case 1: return <ArrowDown className="h-3 w-3" />;
      default: return <Flag className="h-3 w-3" />;
    }
  };

  const handlePostNote = () => {
    if (note.trim()) sendMessageMutation.mutate({ message: note.trim(), message_type: 'note', sender: 'agent' });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Send typing start event
    if (!isAgentTyping && value.length > 0) {
      setIsAgentTyping(true);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'agent_typing',
          is_typing: true,
          session_id: sessionId
        }));
      }
    }

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to send typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsAgentTyping(false);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'agent_typing',
          is_typing: false,
          session_id: sessionId
        }));
      }
    }, 2000);
  };

  // Handler for RichTextEditor onChange
  const handleRichTextChange = (value: string) => {
    setMessage(value);

    // Send typing start event
    if (!isAgentTyping && value.length > 0) {
      setIsAgentTyping(true);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'agent_typing',
          is_typing: true,
          session_id: sessionId
        }));
      }
    }

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to send typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsAgentTyping(false);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'agent_typing',
          is_typing: false,
          session_id: sessionId
        }));
      }
    }, 2000);
  };

  // File upload handlers
  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    let messageContent = message.trim() || '📎 File attachment';

    // Replace template variables with actual values
    messageContent = await replaceTemplateVariables(messageContent, sessionId, agentId);

    // Clear typing timeout and send typing stop
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsAgentTyping(false);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'agent_typing',
        is_typing: false,
        session_id: sessionId
      }));
    }

    // If there are files, upload them first (they'll be broadcasted via WebSocket)
    if (selectedFiles.length > 0) {
      setIsUploadingFiles(true);

      for (const file of selectedFiles) {
        try {
          await uploadConversationFile(file, sessionId);
          toast({
            title: 'File sent',
            description: `${file.name} was sent to the widget`,
          });
        } catch (error) {
          console.error('Failed to send file:', error);
          toast({
            title: 'Send failed',
            description: `Failed to send ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      setIsUploadingFiles(false);
      setSelectedFiles([]);
    }

    // Send message if there's text (files are already sent above)
    if (message.trim()) {
      sendMessageMutation.mutate({ message: messageContent, message_type: 'message', sender: 'agent' });
    }
  };

  const contact: Contact | undefined = sessionDetails?.contact;
  const conversationStatus = sessionDetails?.status || 'bot';
  const conversationPriority = sessionDetails?.priority ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full w-full min-h-0 min-w-0 bg-background rounded-xl overflow-hidden border border-border"
    >
      <div className="flex flex-col flex-grow min-h-0 min-w-0 w-full overflow-hidden">
        {/* Enhanced Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-shrink-0 bg-card relative overflow-hidden"
        >
          {/* Aurora bloom + gradient bottom border */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-violet-600/[0.04] dark:bg-violet-500/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-violet-500/20 via-border to-cyan-500/10 z-10" />

          {/* Top Row - Title and Quick Actions */}
          <div className={`flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 ${!readOnly ? 'border-b border-violet-500/10' : ''}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Back button for read-only mode */}
              {readOnly && onBack && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="hover:bg-violet-500/[0.08] rounded-xl"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
              {/* Contact Avatar — tappable on mobile to open contact panel */}
              <div
                className={`relative ${onContactClick ? 'sm:cursor-default cursor-pointer' : ''}`}
                onClick={onContactClick}
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center border border-border hover:ring-2 hover:ring-primary/30 transition-all">
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                </motion.div>
                {/* Online indicator */}
                {sessionDetails?.is_client_connected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-card"
                  />
                )}
              </div>

              {/* Contact Info */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-[15px] font-semibold text-foreground truncate">
                    {contact?.name || (readOnly ? t('conversations.detail.viewConversation', { defaultValue: 'View Conversation' }) : t('conversations.detail.conversation'))}
                  </h2>
                  <span className="hidden sm:inline px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-medium rounded-full">
                    Customer
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 mt-0.5 min-w-0">
                  {contact?.email && (
                    <span className="text-xs text-muted-foreground truncate max-w-none">{contact.email}</span>
                  )}
                  <span className="text-border">•</span>
                  <span className="text-xs text-muted-foreground/60 font-mono">
                    #{sessionId.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Status — dot only on mobile/tablet, dot+label on desktop */}
              <span className={`rounded-full lg:rounded-lg p-1 lg:px-2.5 lg:py-1 text-[10px] lg:text-xs font-semibold flex items-center gap-1 lg:gap-1.5 ${
                conversationStatus === 'resolved'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : conversationStatus === 'active'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : conversationStatus === 'assigned'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  conversationStatus === 'resolved' ? 'bg-green-500' :
                  conversationStatus === 'active' ? 'bg-blue-500 animate-pulse' :
                  conversationStatus === 'assigned' ? 'bg-purple-500' : 'bg-slate-400'
                }`} title={conversationStatus.charAt(0).toUpperCase() + conversationStatus.slice(1)} />
                <span className="hidden lg:inline">{conversationStatus.charAt(0).toUpperCase() + conversationStatus.slice(1)}</span>
              </span>

              {/* AI Summary Button — desktop only (lg+), tablet/mobile use ⋯ menu */}
              {onSummaryClick && (
                <Button
                  size="sm"
                  onClick={onSummaryClick}
                  className="hidden lg:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-7 px-2.5 text-xs"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('conversations.detail.summary', { defaultValue: 'AI Summary' })}
                </Button>
              )}

              {!readOnly && (
                <>
                  {sessionDetails?.channel === 'twilio_voice' && (contact?.phone_number || sessionDetails?.contact_phone) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { const phone = contact?.phone_number || sessionDetails?.contact_phone || ''; makeCall(phone, contact?.id); }}
                      disabled={callState !== 'idle'}
                      className="hidden lg:flex rounded-lg h-7 px-2.5 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      <Phone className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                      {callState === 'idle' ? 'Call' : 'Calling…'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startCallMutation.mutate()}
                    disabled={startCallMutation.isPending}
                    className="hidden lg:flex rounded-lg h-7 px-2.5 text-xs border-border"
                  >
                    <Video className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                    {t('conversations.detail.videoCall')}
                  </Button>

                  {/* Mobile + tablet: ⋯ overflow menu (hidden only at lg+) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="lg:hidden rounded-lg h-7 w-7 p-0 border-border">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {onSummaryClick && (
                        <DropdownMenuItem onClick={onSummaryClick}>
                          <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                          {t('conversations.detail.summary', { defaultValue: 'AI Summary' })}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => startCallMutation.mutate()} disabled={startCallMutation.isPending}>
                        <Video className="h-3.5 w-3.5 mr-2" />
                        {t('conversations.detail.videoCall')}
                      </DropdownMenuItem>
                      {sessionDetails?.channel === 'twilio_voice' && (contact?.phone_number || sessionDetails?.contact_phone) && (
                        <DropdownMenuItem
                          onClick={() => { const phone = contact?.phone_number || sessionDetails?.contact_phone || ''; makeCall(phone, contact?.id); }}
                          disabled={callState !== 'idle'}
                        >
                          <Phone className="h-3.5 w-3.5 mr-2 text-green-600" />
                          {callState === 'idle' ? 'Call' : 'Calling…'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    size="sm"
                    onClick={() => statusMutation.mutate('resolved')}
                    disabled={statusMutation.isPending || conversationStatus === 'resolved'}
                    title={conversationStatus === 'resolved' ? t('conversations.detail.resolved') : t('conversations.detail.resolve')}
                    className={`rounded-lg h-7 px-2 text-xs ${
                      conversationStatus === 'resolved'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                  >
                    <CheckCircle className={`h-3.5 w-3.5 lg:${isRTL ? 'ml-1' : 'mr-1'}`} />
                    <span className="hidden lg:inline">
                      {conversationStatus === 'resolved' ? t('conversations.detail.resolved') : t('conversations.detail.resolve')}
                    </span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Bottom Row - Controls (hidden in read-only mode) */}
          {!readOnly && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-violet-500/[0.04] to-transparent border-t border-violet-500/10 overflow-x-auto w-full min-w-0"
            >
              {/* AI Toggle */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-muted rounded-md px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-border flex-shrink-0">
                <Bot className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors flex-shrink-0 ${isAiEnabled ? 'text-blue-500' : 'text-muted-foreground'}`} />
                <Label htmlFor="ai-toggle" className="hidden sm:block text-xs font-medium cursor-pointer text-foreground whitespace-nowrap">
                  {t('conversations.detail.aiReplies')}
                </Label>
                <Switch
                  key={`ai-toggle-${sessionId}`}
                  id="ai-toggle"
                  checked={isAiEnabled}
                  onCheckedChange={toggleAiMutation.mutate}
                  className="scale-[0.65] sm:scale-75 data-[state=checked]:bg-blue-500"
                />
              </div>

              {/* Assign To */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-muted rounded-md px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-border flex-shrink-0">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <Select
                  key={`assignee-${sessionId}`}
                  value={sessionDetails?.assignee_id?.toString() || undefined}
                  onValueChange={(value) => assigneeMutation.mutate(parseInt(value))}
                >
                  <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 w-[72px] sm:w-[130px] text-[11px] sm:text-xs font-medium text-foreground">
                    <SelectValue placeholder={t('conversations.detail.assignTo')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Array.isArray(users) && users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="relative h-7 w-7 flex-shrink-0">
                            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                              <span className="text-xs font-bold text-foreground">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${
                              user.presence_status === 'online' ? 'bg-emerald-500' :
                              user.presence_status === 'away' ? 'bg-yellow-400' :
                              user.presence_status === 'busy' || user.presence_status === 'do_not_disturb' ? 'bg-red-500' :
                              user.presence_status === 'in_call' ? 'bg-blue-500' :
                              'bg-slate-400'
                            }`} />
                          </div>
                          <span className="text-sm font-medium">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selector */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-muted rounded-md px-1.5 sm:px-2.5 py-1 sm:py-1.5 border border-border flex-shrink-0">
                <Flag className={`h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 ${conversationPriority > 0 ? PRIORITY_CONFIG[conversationPriority]?.color : 'text-muted-foreground'}`} />
                <Select
                  key={`priority-${sessionId}-${conversationPriority}`}
                  value={conversationPriority.toString()}
                  onValueChange={(value) => priorityMutation.mutate(parseInt(value))}
                >
                  <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 w-[58px] sm:w-[90px] text-[11px] sm:text-xs font-medium text-foreground">
                    <SelectValue placeholder={t('conversations.priority.label', { defaultValue: 'Priority' })} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[0, 1, 2, 3, 4].map((priority) => {
                      const config = PRIORITY_CONFIG[priority];
                      return (
                        <SelectItem key={priority} value={priority.toString()} className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className={config.color}>{getPriorityIcon(priority)}</span>
                            <span className={`text-sm font-medium ${config.color}`}>
                              {t(`conversations.priority.${config.label.toLowerCase()}`, { defaultValue: config.label })}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Spacer */}
              <div className={isRTL ? 'mr-auto' : 'ml-auto'} />
            </motion.div>
          )}
        </motion.header>

        {/* Enhanced Messages Area */}
        <main ref={messagesContainerRef} className="flex-grow overflow-y-auto min-h-0 p-4 bg-muted/20 relative">

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 py-4"
              >
                {/* Skeleton loading */}
                {[...Array(5)].map((_, i) => (
                  <MessageSkeleton key={i} isUser={i % 2 === 0} />
                ))}
              </motion.div>
            ) : messages && messages.length > 0 ? (
              <motion.div
                key="messages"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2 relative z-10"
              >
                {/* Loading indicator for fetching older messages */}
                <AnimatePresence>
                  {isFetchingNextPage && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex justify-center py-4"
                    >
                      <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-full shadow-sm border border-border">
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground font-medium">
                          {t('conversations.detail.loadingOlderMessages', { defaultValue: 'Loading older messages...' })}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Beginning of conversation indicator */}
                {!hasNextPage && messagesData && messagesData.pages.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center py-4"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
                      <ChevronUp className="h-4 w-4" />
                      <span className="font-medium">{t('conversations.detail.noMoreMessages', { defaultValue: 'Beginning of conversation' })}</span>
                      <ChevronUp className="h-4 w-4" />
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
                    </div>
                  </motion.div>
                )}

                {messages.map((msg, index) => {
                  const showDateSeparator = index === 0 || isDifferentDay(messages[index - 1].timestamp, msg.timestamp);

                  return (
                    <motion.div
                      key={`${msg.id}-${index}`}
                      variants={messageVariants}
                    >
                      {/* Enhanced Date Separator */}
                      {showDateSeparator && (
                        <div className="flex items-center justify-center my-8">
                          <div className="flex items-center gap-4">
                            <div className="h-px w-16 bg-gradient-to-r from-transparent via-border to-border" />
                            <div className="bg-card px-4 py-1.5 rounded-full shadow-sm border border-border">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  {formatDateSeparator(new Date(msg.timestamp))}
                                </p>
                              </div>
                            </div>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent via-border to-border" />
                          </div>
                        </div>
                      )}

                      {msg.message_type === 'note' ? (
                        /* Enhanced Private Note */
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex justify-center my-6"
                        >
                          <div className="max-w-2xl w-full bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 rounded-xl p-5">
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-800/30 flex items-center justify-center flex-shrink-0">
                                <Book className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-bold text-violet-700 dark:text-violet-400">{t('conversations.detail.privateNote')}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-200/50 dark:bg-violet-800/30 text-violet-700 dark:text-violet-400 font-medium">Internal Only</span>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{msg.message}</p>
                                <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-3 flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  {new Date(msg.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        /* Enhanced Regular Message */
                        <div className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                          {msg.sender === 'user' && (
                            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-muted border border-border flex items-center justify-center">
                              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'} max-w-[85%] sm:max-w-[65%]`}>
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl ${
                                msg.sender === 'user'
                                  ? `bg-card border border-border ${isRTL ? 'rounded-br-md' : 'rounded-bl-md'} text-foreground shadow-sm`
                                  : `bg-primary text-primary-foreground ${isRTL ? 'rounded-bl-md' : 'rounded-br-md'} shadow-sm`
                              }`}
                            >
                              <div className="prose prose-sm dark:prose-invert max-w-full prose-p:my-1 prose-headings:my-2">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    a: ({node, ...props}) => (
                                      <a
                                        {...props}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${msg.sender === 'user' ? 'text-primary hover:text-primary/80' : 'text-primary-foreground/80 hover:text-primary-foreground'} underline underline-offset-2 transition-colors`}
                                      />
                                    ),
                                    p: ({node, ...props}) => <p className="text-[13px] leading-snug break-words" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                    em: ({node, ...props}) => <em className="italic" {...props} />,
                                    code({ node, className, children, ...props }: any) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      const isBlock = !props.inline;
                                      return isBlock && match ? (
                                        <SyntaxHighlighter
                                          style={oneDark}
                                          language={match[1]}
                                          PreTag="div"
                                          className="rounded-lg text-xs !my-2"
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      ) : (
                                        <code className={`text-xs px-1 py-0.5 rounded ${msg.sender === 'user' ? 'bg-muted text-foreground' : 'bg-primary-foreground/20 text-primary-foreground'}`} {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message)}
                                </ReactMarkdown>
                              </div>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <AttachmentDisplay attachments={msg.attachments} sender={msg.sender} />
                              )}
                              {msg.options && msg.options.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-white/10">
                                  <div className="flex flex-wrap gap-2">
                                    {msg.options.map((option, optionIndex) => {
                                      let displayText: string;
                                      if (option && typeof option === 'object' && 'key' in option && 'value' in option) {
                                        displayText = String((option as {key: string; value: string}).value || (option as {key: string; value: string}).key || '');
                                      } else {
                                        displayText = String(option || '');
                                      }
                                      return (
                                        <span
                                          key={optionIndex}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            msg.sender === 'user'
                                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                              : 'bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30'
                                          }`}
                                        >
                                          {displayText}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] mt-1 px-1 flex items-center gap-1 text-muted-foreground/60">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {msg.sender !== 'user' && (
                            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <Bot className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </motion.div>
            ) : (
              /* Enhanced Empty State */
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center max-w-sm">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative inline-block mb-6"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-semibold text-foreground mb-2"
                  >
                    {t('conversations.detail.noMessages')}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-muted-foreground text-sm leading-relaxed"
                  >
                    {t('conversations.detail.noMessagesDesc')}
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Composer */}
        {!readOnly && (
          <motion.footer
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
            className="flex-shrink-0 px-2 pb-2 pt-1"
          >
            {/* AI suggestion chips — above the card */}
            <AnimatePresence>
              {suggestedReplies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2 overflow-hidden"
                >
                  <div className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0" />
                    {suggestedReplies.map((reply, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMessage(reply)}
                        className="flex-shrink-0 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-700/40 rounded-full text-[11px] text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                      >
                        {reply}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Tabs
              defaultValue="reply"
              onValueChange={(v) => setActiveComposerTab(v as 'reply' | 'note')}
              className="w-full"
            >
              {/* Floating composer card — tints violet in note mode */}
              <motion.div
                animate={{ opacity: 1 }}
                className={`rounded-xl border shadow-sm transition-colors duration-200 ${
                  activeComposerTab === 'note'
                    ? 'bg-violet-50/60 dark:bg-violet-900/10 border-violet-200/70 dark:border-violet-700/30'
                    : 'bg-card border-border'
                }`}
              >
                {/* ── Top bar: tabs + draft indicator ── */}
                <div className={`flex items-center justify-between px-3 pt-2 pb-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <TabsList className="h-6 p-0.5 bg-muted/70 rounded-lg gap-0">
                    <TabsTrigger
                      value="reply"
                      className="h-5 px-2.5 text-[11px] font-medium rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground transition-all"
                    >
                      {t('conversations.detail.replyTab')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="note"
                      className="h-5 px-2.5 text-[11px] font-medium rounded-md data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-800/50 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm text-muted-foreground transition-all flex items-center gap-1"
                    >
                      <Book className="h-2.5 w-2.5" />
                      {t('conversations.detail.privateNoteTab')}
                    </TabsTrigger>
                  </TabsList>

                  <AnimatePresence>
                    {hasDraft && (
                      <motion.div
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-muted-foreground/60">Saved</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Reply tab ── */}
                <TabsContent value="reply" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  {/* File chips */}
                  <AnimatePresence>
                    {selectedFiles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden px-3 pb-2"
                      >
                        <div className={`flex items-center gap-1.5 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {selectedFiles.map((file, i) => (
                            <div key={i} className={`flex items-center gap-1.5 pl-2 pr-1.5 py-1 bg-muted rounded-full border border-border text-[11px] text-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Paperclip className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                              <span className="max-w-[120px] truncate">{file.name}</span>
                              <button
                                onClick={() => handleFileRemove(i)}
                                className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
                              >
                                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Text input */}
                  <div className="relative px-3 pb-0 min-h-[34px]">
                    <RichTextEditor
                      value={message}
                      onChange={handleRichTextChange}
                      placeholder={t('conversations.detail.messageInput')}
                      onEnterKey={handleSendMessage}
                      editorRef={replyEditorRef}
                    />
                    {/* Recording overlay */}
                    <AnimatePresence>
                      {isRecording && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center px-3 bg-red-50/80 dark:bg-red-900/20 rounded-lg"
                        >
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <motion.div
                              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                              transition={{ duration: 1.1, repeat: Infinity }}
                              className="w-2 h-2 bg-red-500 rounded-full"
                            />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">Recording…</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Toolbar */}
                  <div className={`flex items-center justify-between px-2 pb-1.5 pt-1 border-t border-border/30 mt-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <EmojiPicker onEmojiSelect={(emoji) => replyEditorRef.current?.insertEmoji(emoji)} />
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        onFileRemove={handleFileRemove}
                        selectedFiles={[]}
                        isUploading={isUploadingFiles}
                        multiple={true}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleMicClick}
                        className={`h-7 w-7 rounded-md transition-all ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        {isRecording ? (
                          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.7, repeat: Infinity }}>
                            <Mic className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <motion.div whileTap={{ scale: 0.94 }}>
                      <Button
                        onClick={handleSendMessage}
                        disabled={sendMessageMutation.isPending || (!message.trim() && selectedFiles.length === 0) || isUploadingFiles}
                        size="sm"
                        className={`h-7 px-3 rounded-md text-xs font-medium gap-1.5 transition-all ${
                          message.trim() || selectedFiles.length > 0
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                        }`}
                      >
                        {sendMessageMutation.isPending || isUploadingFiles ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Send className={`h-3.5 w-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                            {t('conversations.detail.replyTab')}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </TabsContent>

                {/* ── Note tab ── */}
                <TabsContent value="note" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  {/* Text input */}
                  <div className="px-3 pb-0 min-h-[34px]">
                    <RichTextEditor
                      value={note}
                      onChange={(value) => setNote(value)}
                      placeholder={t('conversations.detail.noteInput')}
                      className="bg-transparent"
                      editorRef={noteEditorRef}
                    />
                  </div>

                  {/* Toolbar */}
                  <div className={`flex items-center justify-between px-2 pb-1.5 pt-1 border-t border-violet-200/40 dark:border-violet-700/20 mt-0.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 bg-violet-100/70 dark:bg-violet-800/20 rounded-full ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-violet-700 dark:text-violet-400 font-medium whitespace-nowrap">Team only · not visible to customer</span>
                    </div>

                    <motion.div whileTap={{ scale: 0.94 }}>
                      <Button
                        onClick={handlePostNote}
                        disabled={sendMessageMutation.isPending || !note.trim()}
                        size="sm"
                        className={`h-7 px-3 rounded-md text-xs font-medium gap-1.5 transition-all ${
                          note.trim()
                            ? 'bg-violet-500 hover:bg-violet-600 text-white shadow-sm'
                            : 'bg-violet-100/50 dark:bg-violet-900/20 text-violet-400 dark:text-violet-600 cursor-not-allowed'
                        }`}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Book className="h-3.5 w-3.5" />
                            Save Note
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </TabsContent>
              </motion.div>
            </Tabs>
          </motion.footer>
        )}
      </div>

    </motion.div>
  );
};