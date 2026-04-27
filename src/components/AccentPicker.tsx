import { Check } from 'lucide-react';
import { ACCENT_PRESETS, usePersonalization } from '@/contexts/PersonalizationContext';

/**
 * AccentPicker — six color swatches that re-tint the entire app.
 *
 * Lives inside the user-profile dropdown. Each swatch is a square
 * with a corner-to-corner gradient matching the preset. The active
 * preset is ringed in the foreground color; clicking emits a soft
 * pulse-burst animation.
 */
export function AccentPicker() {
  const { accentId, setAccent } = usePersonalization();

  return (
    <div className="px-1 py-1.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Theme accent
        </p>
        <span className="text-[10px] text-muted-foreground/60 font-mono lowercase tracking-tight">
          {ACCENT_PRESETS.find(p => p.id === accentId)?.name ?? 'Aurora'}
        </span>
      </div>
      <div className="accent-picker-grid" role="radiogroup" aria-label="Theme accent">
        {ACCENT_PRESETS.map(preset => {
          const isActive = preset.id === accentId;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={preset.name}
              title={preset.name}
              data-active={isActive}
              onClick={() => setAccent(preset.id)}
              className="accent-swatch"
              style={{
                ['--swatch-gradient' as never]: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]})`,
              }}
            >
              {isActive && (
                <Check
                  className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                  strokeWidth={3}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
