import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRinging(true);
      // Play ringing sound
      if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.play().catch(err => {
          console.log('Could not play ringtone:', err);
        });
      }

      // Auto-reject after 30 seconds
      const timeout = setTimeout(() => {
        handleReject();
      }, 30000);

      return () => {
        clearTimeout(timeout);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsRinging(false);
      };
    }
  }, [isOpen]);

  const handleAccept = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRinging(false);
    onAccept();
  };

  const handleReject = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRinging(false);
    onReject();
  };

  return (
    <>
      {/* Ring tone audio - Incoming call ringtone */}
      <audio
        ref={audioRef}
        src="/microsoft_teams_default.mp3"
      />

      <Dialog open={isOpen} onOpenChange={handleReject}>
        <DialogContent className="sm:max-w-md" hideClose>
          <div className="flex flex-col items-center justify-center py-8">
            {/* Pulsing Avatar */}
            <div className="relative mb-6">
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-green-400",
                  isRinging && "animate-ping opacity-75"
                )}
              />
              <Avatar className="h-32 w-32 relative border-4 border-white shadow-xl">
                {callerAvatar && <AvatarImage src={callerAvatar} />}
                <AvatarFallback className="text-4xl bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                  {callerName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Caller Info */}
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {callerName}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Incoming {callType} call
            </p>
            {channelName && (
              <p className="text-sm text-slate-500 dark:text-slate-500">
                in {channelName}
              </p>
            )}

            {/* Call Actions */}
            <div className="flex items-center gap-8 mt-8">
              {/* Reject Button */}
              <button
                onClick={handleReject}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <PhoneOff className="h-8 w-8 text-white" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Decline
                </span>
              </button>

              {/* Accept Button */}
              <button
                onClick={handleAccept}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform animate-pulse">
                  {callType === 'video' ? (
                    <Video className="h-8 w-8 text-white" />
                  ) : (
                    <Phone className="h-8 w-8 text-white" />
                  )}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Accept
                </span>
              </button>
            </div>

            {/* Auto-reject warning */}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
              Call will automatically end in 30 seconds
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IncomingCallModal;
