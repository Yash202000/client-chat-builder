import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useTheme } from '@/hooks/useTheme';

export interface MessageNotification {
  id: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  channelId: number;
  channelName: string;
  preview: string;
}

interface Props {
  notifications: MessageNotification[];
  onDismiss: (id: string) => void;
  onNavigate: (channelId: number) => void;
}

const AUTODISMISS_MS = 8000;

const NotificationCard: React.FC<{
  notification: MessageNotification;
  onDismiss: (id: string) => void;
  onNavigate: (channelId: number) => void;
}> = ({ notification, onDismiss, onNavigate }) => {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const dismiss = setTimeout(() => onDismiss(notification.id), AUTODISMISS_MS);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.max(0, 100 - (elapsed / AUTODISMISS_MS) * 100));
    }, 50);
    return () => {
      clearTimeout(dismiss);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [notification.id]);

  // Pause countdown while user is typing
  const handleFocus = () => {
    startRef.current = Date.now() - ((100 - progress) / 100) * AUTODISMISS_MS;
  };

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_BASE_URL}/api/v1/chat/channels/${notification.channelId}/messages`,
        { content: text, channel_id: notification.channelId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      onDismiss(notification.id);
    } catch {
      setSending(false);
    }
  };

  const initial = (notification.senderName[0] || '?').toUpperCase();

  return (
    <div className="w-[360px] rounded-xl shadow-2xl border border-border bg-card overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Avatar className="h-9 w-9 flex-shrink-0">
          {notification.senderAvatar && <AvatarImage src={notification.senderAvatar} />}
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate leading-tight">{notification.senderName}</p>
          <p className="text-xs text-muted-foreground truncate">{notification.channelName}</p>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent flex-shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message preview */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/90 line-clamp-2 leading-relaxed">{notification.preview}</p>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-border" />

      {/* Reply input */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500 transition-all">
          <input
            ref={inputRef}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            onFocus={handleFocus}
            placeholder="Reply..."
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            className="text-violet-500 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => { onNavigate(notification.channelId); onDismiss(notification.id); }}
          className="flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-600 hover:underline transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View in chat
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-violet-500 transition-none" style={{ width: `${progress}%` }} />
    </div>
  );
};

const MessageNotificationPopup: React.FC<Props> = ({ notifications, onDismiss, onNavigate }) => {
  const { theme } = useTheme();
  if (notifications.length === 0) return null;

  return createPortal(
    <div className={`fixed bottom-6 right-6 z-[9998] flex flex-col gap-3 items-end ${theme}`}>
      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} onDismiss={onDismiss} onNavigate={onNavigate} />
      ))}
    </div>,
    document.body
  );
};

export default MessageNotificationPopup;
