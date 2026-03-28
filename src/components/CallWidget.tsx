import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { useTwilioCall } from '@/contexts/TwilioCallContext';
import { Button } from '@/components/ui/button';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CallWidget() {
  const { callState, activeCallInfo, duration, isMuted, hangup, toggleMute, error } = useTwilioCall();

  const visible = callState !== 'idle';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
        >
          {/* Status bar */}
          <div className={`h-1 w-full ${
            callState === 'in-call' ? 'bg-green-500' :
            callState === 'ringing' ? 'bg-yellow-400 animate-pulse' :
            callState === 'error'   ? 'bg-red-500' :
            'bg-blue-500 animate-pulse'
          }`} />

          <div className="p-4">
            {/* Contact info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-slate-300" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {activeCallInfo?.contactName || activeCallInfo?.toNumber || '—'}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {callState === 'connecting' && 'Connecting…'}
                  {callState === 'ringing' && 'Ringing…'}
                  {callState === 'in-call' && formatDuration(duration)}
                  {callState === 'error' && (error || 'Call failed')}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4">
              {/* Mute */}
              <button
                onClick={toggleMute}
                disabled={callState !== 'in-call'}
                title={isMuted ? 'Unmute' : 'Mute'}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* Hang up */}
              <button
                onClick={hangup}
                title="End call"
                className="h-13 w-13 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors shadow-lg"
                style={{ height: 52, width: 52 }}
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
