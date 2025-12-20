import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, User, Contact, PRIORITY_CONFIG, MessageAttachment } from '@/types';
import { Paperclip, Send, CornerDownRight, Book, CheckCircle, Users, Video, Bot, Mic, MessageSquare, Sparkles, ArrowLeft, AlertTriangle, ArrowUp, Minus, ArrowDown, Flag, FileText, Download, MapPin, Image, File } from 'lucide-react';
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

interface ConversationDetailProps {
  sessionId: string;
  agentId: number;
  readOnly?: boolean;
  onBack?: () => void;
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

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ sessionId, agentId, readOnly = false, onBack }) => {
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
      const res = await authFetch(`/api/v1/conversations/${agentId}/sessions/${sessionId}`);
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
    mutationFn: (enabled: boolean) => authFetch(`/api/v1/conversations/${sessionId}/toggle-ai`, {
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
      const url = pageParam
        ? `/api/v1/conversations/${agentId}/${sessionId}?limit=20&before_id=${pageParam}`
        : `/api/v1/conversations/${agentId}/${sessionId}?limit=20`;
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
        const newMessage = JSON.parse(event.data);

        // Filter out ping/pong messages
        if (newMessage.type === 'ping' || newMessage.type === 'pong') {
          return;
        }

        // Handle contact update messages
        if (newMessage.type === 'contact_updated') {
          console.log('[WebSocket] Contact updated:', newMessage);
          // Refresh session details to get updated contact info
          queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
          return;
        }

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
    mutationFn: (newStatus: string) => authFetch(`/api/v1/conversations/${sessionId}/status`, {
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
      const tokenResponse = await authFetch(`/api/v1/calls/token?session_id=${sessionId}&user_id=${sessionId}`);
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
    mutationFn: (newAssigneeId: number) => authFetch(`/api/v1/conversations/${sessionId}/assignee`, {
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
    mutationFn: (newPriority: number) => authFetch(`/api/v1/conversations/${sessionId}/priority`, {
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
    <div className="flex h-full bg-white dark:bg-slate-800 card-shadow-lg rounded-lg overflow-hidden">
      <div className="flex flex-col flex-grow">
        <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-sm">
          {/* Top Row - Title and Quick Actions */}
          <div className={`flex items-center justify-between px-6 py-4 ${!readOnly ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
            <div className="flex items-center gap-3">
              {/* Back button for read-only mode */}
              {readOnly && onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold dark:text-white">
                  {readOnly ? t('conversations.detail.viewConversation', { defaultValue: 'View Conversation' }) : t('conversations.detail.conversation')}
                </h2>
                <p className="text-xs text-muted-foreground">{t('conversations.detail.sessionId', { id: sessionId.slice(0, 12) + '...' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Badge - always visible */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                conversationStatus === 'resolved' ? 'bg-green-100 text-green-800' :
                conversationStatus === 'active' ? 'bg-blue-100 text-blue-800' :
                conversationStatus === 'assigned' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {conversationStatus.charAt(0).toUpperCase() + conversationStatus.slice(1)}
              </div>

              {/* Action buttons - hidden in read-only mode */}
              {!readOnly && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startCallMutation.mutate()}
                    disabled={startCallMutation.isPending}
                    className="btn-hover-lift"
                  >
                    <Video className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('conversations.detail.videoCall')}
                  </Button>
                  <Button
                    size="sm"
                    variant={conversationStatus === 'resolved' ? 'outline' : 'default'}
                    onClick={() => statusMutation.mutate('resolved')}
                    disabled={statusMutation.isPending || conversationStatus === 'resolved'}
                    className={conversationStatus === 'resolved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-blue-600 hover:bg-blue-700 text-white btn-hover-lift'}
                  >
                    <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {conversationStatus === 'resolved' ? t('conversations.detail.resolved') : t('conversations.detail.resolve')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Bottom Row - Controls (hidden in read-only mode) */}
          {!readOnly && (
          <div className="flex items-center gap-4 px-6 py-3">
            {/* AI Toggle */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 card-shadow">
              <Bot className={`h-4 w-4 ${isAiEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
              <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">
                {t('conversations.detail.aiReplies')}
              </Label>
              <Switch
                key={`ai-toggle-${sessionId}`}
                id="ai-toggle"
                checked={isAiEnabled}
                onCheckedChange={toggleAiMutation.mutate}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* Assign To */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 card-shadow">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select
                key={`assignee-${sessionId}`}
                value={sessionDetails?.assignee_id?.toString() || undefined}
                onValueChange={(value) => assigneeMutation.mutate(parseInt(value))}
              >
                <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 w-[180px]">
                  <SelectValue placeholder={t('conversations.detail.assignTo')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(users) && users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 card-shadow">
              <Flag className={`h-4 w-4 ${conversationPriority > 0 ? PRIORITY_CONFIG[conversationPriority]?.color : 'text-muted-foreground'}`} />
              <Select
                key={`priority-${sessionId}-${conversationPriority}`}
                value={conversationPriority.toString()}
                onValueChange={(value) => priorityMutation.mutate(parseInt(value))}
              >
                <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 w-[120px]">
                  <SelectValue placeholder={t('conversations.priority.label', { defaultValue: 'Priority' })} />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map((priority) => {
                    const config = PRIORITY_CONFIG[priority];
                    return (
                      <SelectItem key={priority} value={priority.toString()}>
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{getPriorityIcon(priority)}</span>
                          <span className={`text-sm ${config.color}`}>
                            {t(`conversations.priority.${config.label.toLowerCase()}`, { defaultValue: config.label })}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Status Badge */}
            <div className={isRTL ? 'mr-auto' : 'ml-auto'}>
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                conversationStatus === 'resolved' ? 'bg-green-100 text-green-800' :
                conversationStatus === 'active' ? 'bg-blue-100 text-blue-800' :
                conversationStatus === 'assigned' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {conversationStatus.charAt(0).toUpperCase() + conversationStatus.slice(1)}
              </div>
            </div>
          </div>
          )}
        </header>

        <main ref={messagesContainerRef} className="flex-grow overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground">{t('conversations.detail.loadingMessages')}</p>
              </div>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {/* Loading indicator for fetching older messages */}
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>{t('conversations.detail.loadingOlderMessages', { defaultValue: 'Loading older messages...' })}</span>
                  </div>
                </div>
              )}
              {/* Show message if no more messages to load and we have loaded multiple pages */}
              {!hasNextPage && messagesData && messagesData.pages.length > 1 && (
                <div className="flex justify-center py-2">
                  <p className="text-xs text-muted-foreground">{t('conversations.detail.noMoreMessages', { defaultValue: 'Beginning of conversation' })}</p>
                </div>
              )}
              {messages.map((msg, index) => {
                // Check if we need to show a date separator
                const showDateSeparator = index === 0 || isDifferentDay(messages[index - 1].timestamp, msg.timestamp);

                return (
                  <div key={`${msg.id}-${index}`}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-6">
                        <div className="relative">
                          <div className="bg-white dark:bg-slate-800 px-4 py-1.5 rounded-md shadow-md border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                              {formatDateSeparator(new Date(msg.timestamp))}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.message_type === 'note' ? (
                    /* Private Note */
                    <div className="flex justify-center my-6">
                      <div className="max-w-2xl w-full bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 card-shadow">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-yellow-400 dark:bg-yellow-600 flex items-center justify-center flex-shrink-0">
                            <Book className="h-4 w-4 text-yellow-900 dark:text-yellow-100" />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-400 mb-1">{t('conversations.detail.privateNote')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{msg.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular Message */
                    <div className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                      {msg.sender === 'user' && (
                        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-slate-200">
                          <AvatarImage src={`https://avatar.vercel.sh/${contact?.email}.png`} alt={contact?.name || 'User'} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                            {contact?.name?.charAt(0)?.toUpperCase() || contact?.email?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'} max-w-[75%]`}>
                        <div
                          className={`px-4 py-3 rounded-2xl card-shadow ${
                            msg.sender === 'user'
                              ? `bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 ${isRTL ? 'rounded-br-sm' : 'rounded-bl-sm'} dark:text-white`
                              : `bg-gradient-to-br from-blue-600 to-purple-600 text-white ${isRTL ? 'rounded-bl-sm' : 'rounded-br-sm'}`
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
                                    className={msg.sender === 'user' ? 'text-blue-600 hover:underline' : 'text-blue-200 hover:underline'}
                                  />
                                ),
                                p: ({node, ...props}) => <p className="text-sm leading-relaxed break-words" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                em: ({node, ...props}) => <em className="italic" {...props} />,
                              }}
                            >
                              {msg.message}
                            </ReactMarkdown>
                          </div>
                          {/* Render attachments with download links */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <AttachmentDisplay attachments={msg.attachments} sender={msg.sender} />
                          )}
                        </div>
                        <p className={`text-xs mt-1.5 px-1 ${msg.sender === 'user' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {msg.sender !== 'user' && (
                        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-purple-200">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('conversations.detail.noMessages')}</h3>
                <p className="text-muted-foreground text-sm">{t('conversations.detail.noMessagesDesc')}</p>
              </div>
            </div>
          )}
        </main>

        {/* Footer - hidden in read-only mode */}
        {!readOnly && (
        <footer className="border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-5 flex-shrink-0">
          <Tabs defaultValue="reply" className="w-full">
            <TabsList className="bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm border dark:border-slate-700">
              <TabsTrigger value="reply" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md relative">
                <CornerDownRight className="h-4 w-4 mr-2"/>
                {t('conversations.detail.replyTab')}
                {message.trim() && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" title={t('conversations.detail.draftSaved', { defaultValue: 'Draft saved' })} />
                )}
              </TabsTrigger>
              <TabsTrigger value="note" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white rounded-md relative">
                <Book className="h-4 w-4 mr-2"/>
                {t('conversations.detail.privateNoteTab')}
                {note.trim() && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" title={t('conversations.detail.draftSaved', { defaultValue: 'Draft saved' })} />
                )}
              </TabsTrigger>
            </TabsList>

            {/* Draft indicator */}
            {hasDraft && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{t('conversations.detail.draftAutoSaved', { defaultValue: 'Draft auto-saved' })}</span>
              </div>
            )}

            <TabsContent value="reply" className="mt-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 card-shadow overflow-hidden">
                <RichTextEditor
                  value={message}
                  onChange={handleRichTextChange}
                  placeholder={t('conversations.detail.messageInput')}
                  onEnterKey={handleSendMessage}
                />
                {/* File Upload Preview (if files selected) */}
                {selectedFiles.length > 0 && (
                  <div className="px-3 pb-2">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      selectedFiles={selectedFiles}
                      isUploading={isUploadingFiles}
                    />
                  </div>
                )}

                <div className={`flex items-center justify-between px-3 pb-2 pt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-1">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      selectedFiles={[]}
                      isUploading={isUploadingFiles}
                      multiple={true}
                    />
                    <Button
                      variant={isRecording ? "destructive" : "ghost"}
                      size="icon"
                      onClick={handleMicClick}
                      className="h-8 w-8"
                    >
                      <Mic className={`h-4 w-4 ${isRecording ? 'text-white' : 'text-gray-500'}`} />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || (!message.trim() && selectedFiles.length === 0) || isUploadingFiles}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white btn-hover-lift"
                  >
                    <Send className={`h-4 w-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
                    {t('conversations.detail.send')}
                  </Button>
                </div>
              </div>

              {suggestedReplies.length > 0 && (
                <div className="mt-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 card-shadow">
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    {t('conversations.detail.aiSuggestions')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setMessage(reply)}
                        className="text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="note" className="mt-4">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-600 card-shadow overflow-hidden">
                <RichTextEditor
                  value={note}
                  onChange={(value) => setNote(value)}
                  placeholder={t('conversations.detail.noteInput')}
                  className="bg-transparent [&_.border-b]:border-yellow-300 dark:[&_.border-b]:border-yellow-600"
                />
                <div className={`flex items-center justify-between px-3 pb-2 pt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-300">
                    <Book className="h-3 w-3" />
                    <span className="font-medium">{t('conversations.detail.privateTeamOnly')}</span>
                  </div>
                  <Button
                    onClick={handlePostNote}
                    disabled={sendMessageMutation.isPending || !note.trim()}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white btn-hover-lift"
                  >
                    <Book className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('conversations.detail.saveNote')}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </footer>
        )}
      </div>

      {isCallModalOpen && (
        <VideoCallModal 
            sessionId={sessionId} 
            userId="agent"
            onClose={() => setCallModalOpen(false)} 
        />
      )}
    </div>
  );
};