import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, User, Contact, PRIORITY_CONFIG, MessageAttachment } from '@/types';
import { Paperclip, Send, CornerDownRight, Book, CheckCircle, Users, Video, Bot, Mic, MessageSquare, Sparkles, ArrowLeft, AlertTriangle, ArrowUp, Minus, ArrowDown, Flag, FileText, Download, MapPin, Image, File, Clock, Loader2, ChevronUp, User as UserIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { VideoCallModal } from './VideoCallModal';
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
import RichTextEditor from './RichTextEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  <div className={`flex items-end gap-3 ${isUser ? 'justify-start' : 'justify-end'}`}>
    {isUser && (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-700 shadow-md opacity-60">
        <UserIcon className="h-5 w-5 text-white" />
      </div>
    )}
    <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} max-w-[60%]`}>
      <div className={`rounded-2xl p-4 skeleton`}>
        <div className="h-4 w-32 rounded skeleton mb-2" />
        <div className="h-4 w-48 rounded skeleton" />
      </div>
      <div className="h-3 w-16 rounded skeleton mt-1.5" />
    </div>
    {!isUser && (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center ring-2 ring-white dark:ring-slate-700 shadow-md opacity-60">
        <Bot className="h-5 w-5 text-white" />
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
                  ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
                  : 'bg-white/20 hover:bg-white/30'
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
                sender === 'user' ? 'text-slate-600 dark:text-slate-400' : 'text-white/80'
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
                        ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-white/20 hover:bg-white/30'
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
                ? 'bg-slate-100 dark:bg-slate-600'
                : 'bg-white/10'
            }`}
          >
            <File className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm truncate block">{att.file_name || 'File'}</span>
              {att.file_size && (
                <span className={`text-xs ${
                  sender === 'user' ? 'text-slate-500 dark:text-slate-400' : 'text-white/70'
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
                    ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 dark:text-blue-300'
                    : 'bg-white/20 hover:bg-white/30'
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

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ sessionId, agentId, readOnly = false, onBack, onSummaryClick }) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { playSuccessSound } = useNotifications();
  const companyId = 1; // Hardcoded company ID
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [isCallModalOpen, setCallModalOpen] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
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
  const previousScrollHeight = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { authFetch, token } = useAuth();
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

    if (sessionId && agentId && token) {
      ws.current = new WebSocket(`${getWebSocketUrl()}/api/v1/ws/${agentId}/${sessionId}?user_type=agent&token=${token}`);
      ws.current.onmessage = (event) => {
        const rawMessage = JSON.parse(event.data);

        // Filter out ping/pong messages
        if (rawMessage.type === 'ping' || rawMessage.type === 'pong') {
          return;
        }

        // Handle contact update messages
        if (rawMessage.type === 'contact_updated') {
          console.log('[WebSocket] Contact updated:', rawMessage);
          // Refresh session details to get updated contact info
          queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
          return;
        }

        // Unwrap message if it's wrapped in { type: "message", message: {...} }
        const newMessage = rawMessage.type === 'message' && rawMessage.message ? rawMessage.message : rawMessage;

        // Filter out typing indicator messages - they should not appear as messages
        if (newMessage.message_type === 'typing') {
          return;
        }

        queryClient.setQueryData(['messages', agentId, sessionId, companyId], (oldData: any) => {
          if (!oldData) return { pages: [[newMessage]], pageParams: [undefined] };

          const lastPage = oldData.pages[oldData.pages.length - 1];
          if (lastPage?.some((msg: ChatMessage) => msg.id === newMessage.id)) {
            return oldData;
          }

          // Add the new message to the last page
          const newPages = [...oldData.pages];
          newPages[newPages.length - 1] = [...lastPage, newMessage];

          return {
            ...oldData,
            pages: newPages
          };
        });
      };
      return () => {
        // Clear typing timeout on unmount
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        ws.current?.close();
      };
    }
  }, [sessionId, agentId, companyId, queryClient, token, readOnly]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: () => authFetch(`/api/v1/users/`).then(res => res.json()),
  });

  const scrollToBottom = (smooth = true) => {
    if (smooth) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  };

  // Reset initial load flag when session changes
  useEffect(() => {
    setHasInitiallyLoaded(false);
  }, [sessionId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !hasInitiallyLoaded) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        scrollToBottom(false); // Instant scroll on initial load
        setHasInitiallyLoaded(true);
      }, 100);
    }
  }, [isLoading, messages.length, hasInitiallyLoaded]);

  // Scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (!hasInitiallyLoaded) return; // Skip on initial load

    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Only auto-scroll if user is already near the bottom
    if (isNearBottom) {
      // Small delay to ensure DOM has updated with new message
      setTimeout(() => {
        scrollToBottom(true); // Smooth scroll for new messages
      }, 50);
    }
  }, [messages, hasInitiallyLoaded]);

  // Handle scroll to load more messages (only after initial load)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasInitiallyLoaded) return;

    const handleScroll = () => {
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
      setCallModalOpen(true);
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
      className="flex h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm card-shadow-lg rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50"
    >
      <div className="flex flex-col flex-grow">
        {/* Enhanced Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-shrink-0 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white via-slate-50/50 to-white dark:from-slate-800 dark:via-slate-900/50 dark:to-slate-800 relative overflow-hidden"
        >
          {/* Decorative gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Top Row - Title and Quick Actions */}
          <div className={`flex items-center justify-between px-6 py-4 ${!readOnly ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
            <div className="flex items-center gap-4">
              {/* Back button for read-only mode */}
              {readOnly && onBack && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
              {/* Contact Avatar */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-lg">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                </motion.div>
                {/* Online indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"
                />
              </div>

              {/* Contact Info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    {contact?.name || (readOnly ? t('conversations.detail.viewConversation', { defaultValue: 'View Conversation' }) : t('conversations.detail.conversation'))}
                  </h2>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-medium rounded-full">
                    Customer
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {contact?.email && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{contact.email}</span>
                  )}
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    #{sessionId.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Enhanced Status Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm ${
                  conversationStatus === 'resolved'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400'
                    : conversationStatus === 'active'
                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400'
                    : conversationStatus === 'assigned'
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400'
                    : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 dark:from-slate-700 dark:to-gray-700 dark:text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  conversationStatus === 'resolved' ? 'bg-green-500' :
                  conversationStatus === 'active' ? 'bg-blue-500 animate-pulse' :
                  conversationStatus === 'assigned' ? 'bg-purple-500' : 'bg-slate-400'
                }`} />
                {conversationStatus.charAt(0).toUpperCase() + conversationStatus.slice(1)}
              </motion.div>

              {/* AI Summary Button */}
              {onSummaryClick && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="sm"
                    onClick={onSummaryClick}
                    className="relative bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25 group overflow-hidden rounded-xl h-9 px-4"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <Sparkles className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} relative z-10`} />
                    <span className="relative z-10 font-medium text-sm">{t('conversations.detail.summary', { defaultValue: 'AI Summary' })}</span>
                  </Button>
                </motion.div>
              )}

              {/* Action buttons - hidden in read-only mode */}
              {!readOnly && (
                <>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startCallMutation.mutate()}
                      disabled={startCallMutation.isPending}
                      className="rounded-xl h-10 border-slate-200 dark:border-slate-600"
                    >
                      <Video className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('conversations.detail.videoCall')}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      onClick={() => statusMutation.mutate('resolved')}
                      disabled={statusMutation.isPending || conversationStatus === 'resolved'}
                      className={`rounded-xl h-10 ${
                        conversationStatus === 'resolved'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20'
                      }`}
                    >
                      <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {conversationStatus === 'resolved' ? t('conversations.detail.resolved') : t('conversations.detail.resolve')}
                    </Button>
                  </motion.div>
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
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-slate-900/30 dark:to-slate-800/30"
            >
              {/* AI Toggle - Enhanced */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <div className={`p-1.5 rounded-lg ${isAiEnabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <Bot className={`h-4 w-4 transition-colors ${isAiEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                </div>
                <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">
                  {t('conversations.detail.aiReplies')}
                </Label>
                <Switch
                  key={`ai-toggle-${sessionId}`}
                  id="ai-toggle"
                  checked={isAiEnabled}
                  onCheckedChange={toggleAiMutation.mutate}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
                />
              </div>

              {/* Assign To - Enhanced */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <Select
                  key={`assignee-${sessionId}`}
                  value={sessionDetails?.assignee_id?.toString() || undefined}
                  onValueChange={(value) => assigneeMutation.mutate(parseInt(value))}
                >
                  <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 w-[180px] font-medium">
                    <SelectValue placeholder={t('conversations.detail.assignTo')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Array.isArray(users) && users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-white">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selector - Enhanced */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <div className={`p-1.5 rounded-lg ${conversationPriority > 0 ? PRIORITY_CONFIG[conversationPriority]?.bgColor : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <Flag className={`h-4 w-4 ${conversationPriority > 0 ? PRIORITY_CONFIG[conversationPriority]?.color : 'text-slate-400'}`} />
                </div>
                <Select
                  key={`priority-${sessionId}-${conversationPriority}`}
                  value={conversationPriority.toString()}
                  onValueChange={(value) => priorityMutation.mutate(parseInt(value))}
                >
                  <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 w-[120px] font-medium">
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
        <main ref={messagesContainerRef} className="flex-grow overflow-y-auto p-6 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 dark:from-slate-900/80 dark:via-slate-800 dark:to-slate-900/50 relative">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />

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
                className="space-y-4 relative z-10"
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
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
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
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-600" />
                      <ChevronUp className="h-4 w-4" />
                      <span className="font-medium">{t('conversations.detail.noMoreMessages', { defaultValue: 'Beginning of conversation' })}</span>
                      <ChevronUp className="h-4 w-4" />
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-300 dark:to-slate-600" />
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
                            <div className="h-px w-16 bg-gradient-to-r from-transparent via-slate-300 to-slate-300 dark:via-slate-600 dark:to-slate-600" />
                            <div className="bg-white dark:bg-slate-800 px-5 py-2 rounded-full shadow-md border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                  {formatDateSeparator(new Date(msg.timestamp))}
                                </p>
                              </div>
                            </div>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent via-slate-300 to-slate-300 dark:via-slate-600 dark:to-slate-600" />
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
                          <div className="max-w-2xl w-full bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-5 shadow-lg shadow-amber-500/10">
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                <Book className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('conversations.detail.privateNote')}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/50 dark:bg-amber-800/30 text-amber-700 dark:text-amber-400 font-medium">Internal Only</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{msg.message}</p>
                                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-3 flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  {new Date(msg.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        /* Enhanced Regular Message */
                        <div className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                          {msg.sender === 'user' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center ring-2 ring-white dark:ring-slate-700 shadow-md">
                                <UserIcon className="h-5 w-5 text-white" />
                              </div>
                            </motion.div>
                          )}
                          <div className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'} max-w-[70%]`}>
                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              className={`px-5 py-3.5 rounded-2xl shadow-md transition-shadow hover:shadow-lg ${
                                msg.sender === 'user'
                                  ? `bg-white dark:bg-slate-700/90 border border-slate-200/80 dark:border-slate-600/50 ${isRTL ? 'rounded-br-md' : 'rounded-bl-md'} dark:text-white`
                                  : `bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-blue-500/20 ${isRTL ? 'rounded-bl-md' : 'rounded-br-md'}`
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
                                        className={`${msg.sender === 'user' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-200 hover:text-white'} underline underline-offset-2 transition-colors`}
                                      />
                                    ),
                                    p: ({node, ...props}) => <p className="text-sm leading-relaxed break-words" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                    em: ({node, ...props}) => <em className="italic" {...props} />,
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
                                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-200'
                                              : 'bg-white/20 text-white hover:bg-white/30'
                                          }`}
                                        >
                                          {displayText}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                            <p className={`text-[11px] mt-2 px-1 flex items-center gap-1.5 ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              <Clock className="h-3 w-3" />
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {msg.sender !== 'user' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-700 shadow-md">
                                <Bot className="h-5 w-5 text-white" />
                              </div>
                            </motion.div>
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
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                      <MessageSquare className="h-12 w-12 text-white" />
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-4 rounded-full border-2 border-dashed border-purple-200 dark:border-purple-800"
                    />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3"
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

        {/* Compact Footer Input - WhatsApp/Instagram Style */}
        {!readOnly && (
          <motion.footer
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 30 }}
            className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900"
          >
            <Tabs defaultValue="reply" className="w-full">
              {/* Minimal Tab Switcher */}
              <div className="flex items-center gap-1 px-3 pt-2">
                <TabsList className="h-auto p-0 bg-transparent gap-1">
                  <TabsTrigger
                    value="reply"
                    className="relative text-xs px-3 py-1 rounded-full data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 text-slate-500 dark:text-slate-400 transition-all duration-200 data-[state=active]:shadow-none"
                  >
                    {t('conversations.detail.replyTab')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="note"
                    className="relative text-xs px-3 py-1 rounded-full data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 text-slate-500 dark:text-slate-400 transition-all duration-200 data-[state=active]:shadow-none"
                  >
                    <span className="flex items-center gap-1">
                      <Book className="h-3 w-3" />
                      {t('conversations.detail.privateNoteTab')}
                    </span>
                  </TabsTrigger>
                </TabsList>

                {/* Draft indicator - minimal */}
                <AnimatePresence>
                  {hasDraft && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="ml-auto text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1"
                    >
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Reply Tab - Compact Input */}
              <TabsContent value="reply" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                {/* AI Suggestions - Compact chips above input */}
                <AnimatePresence>
                  {suggestedReplies.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-3 pt-2"
                    >
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0" />
                        {suggestedReplies.map((reply, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMessage(reply)}
                            className="flex-shrink-0 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-full text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                          >
                            {reply}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* File Preview - Above input */}
                <AnimatePresence>
                  {selectedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-3 pt-2"
                    >
                      <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                        </span>
                        <FileUpload
                          onFileSelect={handleFileSelect}
                          onFileRemove={handleFileRemove}
                          selectedFiles={selectedFiles}
                          isUploading={isUploadingFiles}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Instagram-style Input Bar */}
                <div className="px-3 py-2">
                  <div className={`relative flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-all px-4 py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {/* Input Field */}
                    <div className="flex-1 min-w-0">
                      <RichTextEditor
                        value={message}
                        onChange={handleRichTextChange}
                        placeholder={t('conversations.detail.messageInput')}
                        onEnterKey={handleSendMessage}
                      />

                      {/* Recording overlay */}
                      <AnimatePresence>
                        {isRecording && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/30 rounded-2xl"
                          >
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-2 h-2 bg-red-500 rounded-full"
                              />
                              <span className="text-sm text-red-600 dark:text-red-400">Recording...</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Right Icons - Attachment, Mic, Send */}
                    <div className={`flex items-center gap-1 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {/* Attachment */}
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        onFileRemove={handleFileRemove}
                        selectedFiles={[]}
                        isUploading={isUploadingFiles}
                        multiple={true}
                      />

                      {/* Mic Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleMicClick}
                        className={`h-9 w-9 rounded-full transition-all ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isRecording ? (
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                            <Mic className="h-5 w-5" />
                          </motion.div>
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </Button>

                      {/* Send Button */}
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={handleSendMessage}
                          disabled={sendMessageMutation.isPending || (!message.trim() && selectedFiles.length === 0) || isUploadingFiles}
                          size="icon"
                          className={`h-9 w-9 rounded-full transition-all ${
                            message.trim() || selectedFiles.length > 0
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 bg-transparent'
                          }`}
                        >
                          {sendMessageMutation.isPending || isUploadingFiles ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Private Note Tab - Instagram style */}
              <TabsContent value="note" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="px-3 py-2">
                  <div className={`relative flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700/50 focus-within:border-amber-400 dark:focus-within:border-amber-500 transition-all px-4 py-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {/* Note Input */}
                    <div className="flex-1 min-w-0">
                      <RichTextEditor
                        value={note}
                        onChange={(value) => setNote(value)}
                        placeholder={t('conversations.detail.noteInput')}
                        className="bg-transparent"
                      />
                    </div>

                    {/* Right side - indicator + save button */}
                    <div className={`flex items-center gap-2 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {/* Team only indicator */}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-800/30 rounded-full">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium whitespace-nowrap">Team only</span>
                      </div>

                      {/* Save Note Button */}
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={handlePostNote}
                          disabled={sendMessageMutation.isPending || !note.trim()}
                          size="icon"
                          className={`h-9 w-9 rounded-full transition-all ${
                            note.trim()
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 bg-transparent'
                          }`}
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Book className="h-5 w-5" />
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.footer>
        )}
      </div>

      {isCallModalOpen && (
        <VideoCallModal
          sessionId={sessionId}
          userId="agent"
          onClose={() => setCallModalOpen(false)}
        />
      )}
    </motion.div>
  );
};