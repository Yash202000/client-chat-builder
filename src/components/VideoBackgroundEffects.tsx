import { useState, useCallback, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { Track, LocalVideoTrack, LocalAudioTrack } from 'livekit-client';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import { Sparkles, X, Check, Loader2, Mic, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Video background ──────────────────────────────────────────────────────────

type VideoEffectId = 'none' | 'blur-soft' | 'blur-medium' | 'blur-strong' | string;

const BLUR_OPTIONS = [
  { id: 'blur-soft', label: 'Soft', radius: 3 },
  { id: 'blur-medium', label: 'Medium', radius: 8 },
  { id: 'blur-strong', label: 'Strong', radius: 15 },
];

const VIRTUAL_BACKGROUNDS = [
  { id: 'vbg-indigo', label: 'Indigo', colors: ['#667eea', '#764ba2'] },
  { id: 'vbg-ocean', label: 'Ocean', colors: ['#0093E9', '#80D0C7'] },
  { id: 'vbg-sunset', label: 'Sunset', colors: ['#FA8231', '#e74c3c'] },
  { id: 'vbg-forest', label: 'Forest', colors: ['#134E5E', '#71B280'] },
  { id: 'vbg-night', label: 'Night', colors: ['#0f0c29', '#302b63'] },
  { id: 'vbg-rose', label: 'Rose', colors: ['#f953c6', '#b91d73'] },
];

function makeGradientDataUrl(color1: string, color2: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

// ── Audio noise ───────────────────────────────────────────────────────────────

type NoiseLevel = 'off' | 'standard' | 'enhanced';

const NOISE_OPTIONS: { id: NoiseLevel; label: string; description: string; constraints: MediaTrackConstraintSet }[] = [
  {
    id: 'off',
    label: 'Off',
    description: 'Raw microphone input',
    constraints: { noiseSuppression: false, echoCancellation: false, autoGainControl: false },
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Filters background noise',
    constraints: { noiseSuppression: true, echoCancellation: false, autoGainControl: false },
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    description: 'Noise + echo + auto gain',
    constraints: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

type Tab = 'video' | 'audio';

export function VideoBackgroundEffects() {
  const room = useRoomContext();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('video');

  // video state
  const [activeVideoEffect, setActiveVideoEffect] = useState<VideoEffectId>('none');
  const [isApplyingVideo, setIsApplyingVideo] = useState(false);
  const gradientCache = useRef<Map<string, string>>(new Map());

  // audio state
  const [activeNoiseLevel, setActiveNoiseLevel] = useState<NoiseLevel>('standard');
  const [isApplyingAudio, setIsApplyingAudio] = useState(false);

  const applyVideoEffect = useCallback(async (effectId: VideoEffectId) => {
    if (isApplyingVideo || effectId === activeVideoEffect) return;
    setIsApplyingVideo(true);
    try {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
      const track = pub?.track;
      if (!(track instanceof LocalVideoTrack)) return;

      if (effectId === 'none') {
        await track.stopProcessor();
      } else if (effectId.startsWith('blur')) {
        const opt = BLUR_OPTIONS.find(b => b.id === effectId);
        if (opt) await track.setProcessor(BackgroundBlur(opt.radius));
      } else {
        const bg = VIRTUAL_BACKGROUNDS.find(b => b.id === effectId);
        if (bg) {
          if (!gradientCache.current.has(effectId)) {
            gradientCache.current.set(effectId, makeGradientDataUrl(bg.colors[0], bg.colors[1]));
          }
          await track.setProcessor(VirtualBackground(gradientCache.current.get(effectId)!));
        }
      }
      setActiveVideoEffect(effectId);
    } catch (err) {
      console.error('[VideoBackgroundEffects] video:', err);
    } finally {
      setIsApplyingVideo(false);
    }
  }, [room, isApplyingVideo, activeVideoEffect]);

  const applyNoiseLevel = useCallback(async (level: NoiseLevel) => {
    if (isApplyingAudio || level === activeNoiseLevel) return;
    setIsApplyingAudio(true);
    try {
      const pub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      const track = pub?.track;
      if (!(track instanceof LocalAudioTrack)) return;
      const opt = NOISE_OPTIONS.find(n => n.id === level)!;
      await track.mediaStreamTrack.applyConstraints(opt.constraints);
      setActiveNoiseLevel(level);
    } catch (err) {
      console.error('[VideoBackgroundEffects] audio:', err);
    } finally {
      setIsApplyingAudio(false);
    }
  }, [room, isApplyingAudio, activeNoiseLevel]);

  const isApplying = isApplyingVideo || isApplyingAudio;

  return (
    <div className="absolute bottom-[76px] left-3 z-20 select-none">
      {isOpen && (
        <div className="mb-2 w-56 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setTab('video')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                  tab === 'video' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                )}
              >
                <Video className="w-3 h-3" />
                Video
              </button>
              <button
                onClick={() => setTab('audio')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                  tab === 'audio' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                )}
              >
                <Mic className="w-3 h-3" />
                Audio
              </button>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white/70 transition-colors ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Video tab ── */}
          {tab === 'video' && (
            <>
              <button
                onClick={() => applyVideoEffect('none')}
                disabled={isApplyingVideo}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors mb-2',
                  activeVideoEffect === 'none' ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                <Check className={cn('w-3 h-3 flex-shrink-0', activeVideoEffect === 'none' ? 'text-green-400' : 'opacity-0')} />
                No effect
              </button>

              <p className="text-[10px] text-white/35 uppercase tracking-widest px-2 mb-1">Blur</p>
              <div className="space-y-0.5 mb-3">
                {BLUR_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => applyVideoEffect(id)}
                    disabled={isApplyingVideo}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                      activeVideoEffect === id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Check className={cn('w-3 h-3 flex-shrink-0', activeVideoEffect === id ? 'text-blue-400' : 'opacity-0')} />
                    {label}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-white/35 uppercase tracking-widest px-2 mb-1.5">Virtual</p>
              <div className="grid grid-cols-3 gap-1.5">
                {VIRTUAL_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => applyVideoEffect(bg.id)}
                    disabled={isApplyingVideo}
                    title={bg.label}
                    className={cn(
                      'relative h-10 rounded-lg overflow-hidden border-2 transition-all duration-150',
                      activeVideoEffect === bg.id ? 'border-blue-400 scale-[1.06]' : 'border-transparent hover:border-white/30'
                    )}
                    style={{ background: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]})` }}
                  >
                    {activeVideoEffect === bg.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Audio tab ── */}
          {tab === 'audio' && (
            <div className="space-y-1">
              <p className="text-[10px] text-white/35 uppercase tracking-widest px-2 mb-2">Noise suppression</p>
              {NOISE_OPTIONS.map(({ id, label, description }) => (
                <button
                  key={id}
                  onClick={() => applyNoiseLevel(id)}
                  disabled={isApplyingAudio}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors text-left',
                    activeNoiseLevel === id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Check className={cn('w-3 h-3 flex-shrink-0', activeNoiseLevel === id ? 'text-purple-400' : 'opacity-0')} />
                  <div>
                    <p className={cn('font-medium', activeNoiseLevel === id ? 'text-white' : 'text-white/70')}>{label}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{description}</p>
                  </div>
                </button>
              ))}

              <div className="mt-3 px-2 pt-3 border-t border-white/10">
                <p className="text-[10px] text-white/30 leading-relaxed">
                  Uses your browser's built-in audio processing. Works best in Chrome and Edge.
                </p>
              </div>
            </div>
          )}

          {isApplying && (
            <div className="flex items-center gap-1.5 mt-2.5 px-2 text-[10px] text-white/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              Applying…
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-lg',
          isOpen
            ? 'bg-blue-500 text-white shadow-blue-500/30'
            : 'bg-black/55 backdrop-blur-sm text-white/80 hover:bg-black/75 border border-white/10'
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Effects
      </button>
    </div>
  );
}
