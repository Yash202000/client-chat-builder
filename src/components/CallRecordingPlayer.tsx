import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Mic, Play, Pause, Download, Clock } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface VoiceCall {
  id: number;
  call_sid: string;
  from_number: string;
  to_number: string;
  direction: string;
  status: string;
  started_at: string;
  duration_seconds?: number;
  recording_url?: string;
  recording_duration_secs?: number;
  full_transcript?: string;
}

interface Props {
  sessionId: string;
}

function fmt(secs?: number | null): string {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function AudioPlayer({ url, duration }: { url: string; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const progress = duration && duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 bg-muted/60 rounded-lg px-3 py-2">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      <button
        onClick={toggle}
        className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 hover:bg-primary/90 transition-colors"
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-muted-foreground">{fmt(current)}</span>
          <span className="text-[10px] text-muted-foreground">{fmt(duration)}</span>
        </div>
      </div>
      <a
        href={url}
        download
        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Download recording"
      >
        <Download className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export function CallRecordingPlayer({ sessionId }: Props) {
  const { authFetch } = useAuth();
  const { t } = useTranslation();

  const { data: calls } = useQuery<VoiceCall[]>({
    queryKey: ['voice_calls', sessionId],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/twilio/calls?conversation_id=${sessionId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.calls ?? data ?? [];
    },
    enabled: !!sessionId,
  });

  const callsWithRecording = calls?.filter(c => c.recording_url) ?? [];
  const allCalls = calls ?? [];

  if (allCalls.length === 0) return null;

  return (
    <div className="border-t border-border/60">
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
        <Mic className="h-3 w-3 text-muted-foreground/60" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {t('voiceCalls.sectionTitle')}
        </p>
      </div>

      <div className="px-4 pb-3 space-y-3">
        {allCalls.map(call => (
          <div key={call.id} className="space-y-1.5">
            {/* Call metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                  call.status === 'completed' ? 'bg-emerald-500' :
                  call.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                <span className="text-[11px] font-medium text-foreground">
                  {call.direction === 'inbound' ? call.from_number : call.to_number}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">({t(`voiceCalls.${call.direction}`, call.direction)})</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {fmt(call.duration_seconds ?? call.recording_duration_secs)}
              </div>
            </div>

            {/* Recording player */}
            {call.recording_url ? (
              <AudioPlayer url={call.recording_url} duration={call.recording_duration_secs ?? call.duration_seconds} />
            ) : (
              <p className="text-[10px] text-muted-foreground/50 italic">{t('voiceCalls.noRecording')}</p>
            )}

            {/* Transcript snippet */}
            {call.full_transcript && (
              <details className="group">
                <summary className="text-[10px] text-primary cursor-pointer list-none hover:underline">
                  {t('voiceCalls.viewTranscript')}
                </summary>
                <p className="mt-1 text-[11px] text-foreground/80 leading-relaxed bg-muted/40 rounded-md p-2 max-h-40 overflow-y-auto">
                  {call.full_transcript}
                </p>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
