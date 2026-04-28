import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PhoneOff, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface CallingModalProps {
  isOpen: boolean;
  recipientName: string;
  recipientAvatar?: string;
  channelName?: string;
  onCancel: () => void;
  status: 'calling' | 'ringing' | 'connecting';
}

const CallingModal: React.FC<CallingModalProps> = ({
  isOpen,
  recipientName,
  recipientAvatar,
  channelName,
  onCancel,
  status,
}) => {
  const [isPulsing, setIsPulsing] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Play/stop ringtone based on modal state
  useEffect(() => {
    if (isOpen && audioRef.current) {
      // Play ringtone when modal opens
      audioRef.current.play().catch((err) => {
        console.error('Failed to play outgoing ringtone:', err);
      });
    }

    // Cleanup: stop audio when modal closes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsPulsing(false);
    } else {
      setIsPulsing(true);
    }
  }, [isOpen]);

  const getStatusText = () => {
    switch (status) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Calling...';
    }
  };

  return (
    <>
      {/* Outgoing call ringtone */}
      <audio
        ref={audioRef}
        src="/microsoft_teams_default.mp3"
        loop
      />

      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent className="sm:max-w-md" hideClose>
          <VisuallyHidden>
            <DialogTitle>Outgoing Call</DialogTitle>
            <DialogDescription>
              Calling {recipientName}. Please wait for them to answer.
            </DialogDescription>
          </VisuallyHidden>
        <div className="flex flex-col items-center justify-center py-8">
          {/* Pulsing Avatar */}
          <div className="relative mb-6">
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-blue-400",
                isPulsing && "animate-ping opacity-75"
              )}
            />
            <Avatar className="h-32 w-32 relative border-4 border-white shadow-xl">
              {recipientAvatar && <AvatarImage src={recipientAvatar} />}
              <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                {recipientName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Recipient Info */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {recipientName}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2 animate-pulse">
            {getStatusText()}
          </p>
          {channelName && (
            <p className="text-sm text-slate-500 dark:text-slate-500">
              in {channelName}
            </p>
          )}

          {/* Call Actions */}
          <div className="flex items-center gap-8 mt-8">
            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <PhoneOff className="h-8 w-8 text-white" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Cancel
              </span>
            </button>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 mt-6">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CallingModal;
