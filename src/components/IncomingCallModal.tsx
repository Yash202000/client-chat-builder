import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';
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
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(30);
    startRingtone();

    const countdown = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(countdown); handleReject(); return 0; }
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

  return createPortal(
    <div className={`fixed bottom-6 right-6 z-[9999] w-[380px] animate-in slide-in-from-bottom-4 fade-in duration-200 ${theme}`}>
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">

        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-400 to-cyan-400" />

        <div className="p-6">
          {/* Avatar + info row */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-green-400/25 animate-ping" />
              <span className="absolute inset-[-7px] rounded-full border-2 border-green-400/30 animate-pulse" />
              <Avatar className="h-16 w-16 relative ring-2 ring-green-400/50 shadow-lg">
                <AvatarImage src={callerAvatar} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                  {callerName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-widest mb-1">
                Incoming {callType === 'video' ? 'video' : 'audio'} call
              </p>
              <p className="text-foreground font-bold text-lg truncate leading-tight">{callerName}</p>
              {channelName && (
                <p className="text-muted-foreground text-xs truncate mt-0.5">{channelName}</p>
              )}
            </div>

            {/* Countdown ring */}
            <div className="relative flex-shrink-0 w-11 h-11">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                  strokeDasharray={`${(secondsLeft / 30) * 113} 113`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s linear' }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-semibold text-foreground">
                {secondsLeft}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white text-sm font-semibold transition-all duration-150 group">
              <PhoneOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Decline
            </button>
            <button onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 border border-green-500 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-green-500/25 group">
              {callType === 'video'
                ? <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
                : <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IncomingCallModal;
