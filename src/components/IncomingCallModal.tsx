import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PhoneOff, Video, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/hooks/useTheme';
import { startRingtone, stopRingtone } from '@/utils/ringtone';

interface IncomingCallModalProps {
  isOpen: boolean;
  callerName: string;
  callerAvatar?: string;
  channelName?: string;
  onAccept: () => void;
  onReject: () => void;
  callType?: 'video' | 'audio';
}

const COUNTDOWN_SEC = 30;

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  callerName,
  callerAvatar,
  channelName,
  onAccept,
  onReject,
  callType = 'video',
}) => {
  const { theme } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SEC);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(COUNTDOWN_SEC);
    startRingtone();

    const countdown = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(countdown);
          stopRingtone();
          onReject();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdown);
      stopRingtone();
    };
  }, [isOpen]);

  const handleAccept = () => { stopRingtone(); onAccept(); };
  const handleReject = () => { stopRingtone(); onReject(); };

  if (!isOpen) return null;

  const progress = (secondsLeft / COUNTDOWN_SEC) * 100;

  return createPortal(
    <div className={`fixed bottom-6 right-6 z-[9999] ${theme}`}>
      <div className="w-[360px] rounded-xl shadow-2xl border border-border bg-card overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200">

        {/* Pulsing accent bar */}
        <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 animate-pulse" />

        {/* Header row */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div className="relative flex-shrink-0">
            <span className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
            <Avatar className="h-10 w-10 relative ring-2 ring-green-400/50">
              <AvatarImage src={callerAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold">
                {callerName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">{callerName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {channelName
                ? `Incoming ${callType} call · ${channelName}`
                : `Incoming ${callType} call`}
            </p>
          </div>

          {/* Countdown badge */}
          <div className="flex-shrink-0 text-xs font-mono font-semibold text-muted-foreground bg-muted rounded-md px-2 py-0.5">
            {secondsLeft}s
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-border" />

        {/* Action buttons */}
        <div className="flex gap-3 px-4 py-3">
          <button
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white text-sm font-semibold transition-all duration-150 group"
          >
            <PhoneOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Decline
          </button>

          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-white text-sm font-semibold transition-all duration-150 shadow-md shadow-green-500/30 group"
          >
            {callType === 'video'
              ? <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
              : <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            Accept
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="h-0.5 bg-green-500 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>,
    document.body
  );
};

export default IncomingCallModal;
