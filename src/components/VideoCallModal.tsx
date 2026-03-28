
import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useAuth } from "@/hooks/useAuth";
import { LIVEKIT_URL } from "@/config/env";
import { toast } from 'sonner';
import { X, Minimize2, Maximize2, GripHorizontal } from 'lucide-react';

interface VideoCallModalProps {
  sessionId: string;
  userId: string;
  onClose: () => void;
}

// Custom hook for draggable functionality
const useDraggable = (initialPosition: { x: number; y: number }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    // Calculate new position with bounds checking
    const newX = Math.max(0, Math.min(window.innerWidth - 320, dragRef.current.initialX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - 240, dragRef.current.initialY + deltaY));

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return { position, isDragging, handleMouseDown, setPosition };
};

export const VideoCallModal: React.FC<VideoCallModalProps> = ({ sessionId, userId, onClose }) => {
  const [token, setToken] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const { authFetch } = useAuth();

  // Draggable state for minimized window - start at bottom right
  const { position, isDragging, handleMouseDown, setPosition } = useDraggable({
    x: window.innerWidth - 340,
    y: window.innerHeight - 264
  });

  // Reset position when maximizing then minimizing again
  const handleMinimize = () => {
    setPosition({
      x: window.innerWidth - 340,
      y: window.innerHeight - 264
    });
    setIsMinimized(true);
  };

  useEffect(() => {
    (async () => {
      try {
        const resp = await authFetch(
          `/api/v1/calls/token?session_id=${sessionId}&user_id=${userId}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error('Failed to get video call token:', e);
        toast.error('Failed to start video call');
        onClose();
      }
    })();
  }, [sessionId, userId]);

  // Loading state - also use portal
  if (token === '') {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[99999]">
        <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white font-medium text-lg">Connecting to video call...</p>
          <p className="text-white/60 text-sm">Please wait while we set up your call</p>
        </div>
      </div>,
      document.body
    );
  }

  // Minimized view - small floating draggable window with theme colors
  if (isMinimized) {
    return createPortal(
      <div
        className={`fixed rounded-2xl overflow-hidden z-[99999] ${
          isDragging ? 'scale-[1.02]' : 'scale-100'
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '320px',
          height: '240px',
          boxShadow: isDragging
            ? '0 35px 60px -15px rgba(59, 130, 246, 0.5), 0 0 0 2px rgba(59, 130, 246, 0.6)'
            : '0 25px 50px -12px rgba(59, 130, 246, 0.4)',
          transition: isDragging ? 'none' : 'all 0.2s ease',
        }}
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 p-[2px]">
          <div className="w-full h-full rounded-2xl bg-slate-900 overflow-hidden">
            {/* Drag handle & Control bar */}
            <div
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2.5 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-transparent"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-500/20">
                  <GripHorizontal className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-white/90 text-xs font-medium">Video Call</span>
                </div>
              </div>
              <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsMinimized(false)}
                  className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 transition-colors group"
                  title="Maximize"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-blue-300 group-hover:text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 transition-colors group"
                  title="End Call"
                >
                  <X className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                </button>
              </div>
            </div>
            <LiveKitRoom
              video={true}
              audio={true}
              token={token}
              serverUrl={LIVEKIT_URL}
              data-lk-theme="default"
              style={{ height: '100%', width: '100%' }}
              onDisconnected={onClose}
              onError={(error) => {
                console.error('Video call error:', error);
                toast.error('Video call connection failed');
                onClose();
              }}
            >
              <VideoConference />
            </LiveKitRoom>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Full screen view - use portal to render at body level with theme styling
  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[99999]">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main container with gradient border */}
      <div className="relative w-[95%] h-[95%] max-w-[1600px] rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.4), 0 0 100px -20px rgba(99, 102, 241, 0.3)',
        }}
      >
        {/* Gradient border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 p-[2px]">
          <div className="w-full h-full rounded-2xl bg-slate-900 flex flex-col overflow-hidden">
            {/* Custom control bar with gradient */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-800/95 to-slate-900 border-b border-blue-500/20">
              <div className="flex items-center gap-4">
                {/* Logo/Icon */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Video Call in Progress</h3>
                  <p className="text-blue-300/70 text-xs">Connected • HD Quality</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMinimize}
                  className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all flex items-center gap-2 text-blue-200 hover:text-white text-sm font-medium group"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Minimize</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 transition-all flex items-center gap-2 text-red-300 hover:text-white text-sm font-medium group"
                  title="End Call"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">End Call</span>
                </button>
              </div>
            </div>

            {/* Video area */}
            <div className="flex-1 overflow-hidden bg-slate-950">
              <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={LIVEKIT_URL}
                data-lk-theme="default"
                style={{ height: '100%', width: '100%' }}
                onDisconnected={onClose}
                onError={(error) => {
                  console.error('Video call error:', error);
                  toast.error('Video call connection failed');
                  onClose();
                }}
              >
                <VideoConference />
              </LiveKitRoom>
            </div>

            {/* Bottom gradient accent */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
