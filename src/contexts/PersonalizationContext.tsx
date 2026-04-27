import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

/* ────────────────────────────────────────────────────────────
   ACCENT PRESETS — six curated palettes that re-tint the app.
   Each preset overrides three aurora CSS variables:
   --aurora-violet, --aurora-cyan, --aurora-indigo
   which propagate through every glow/gradient in the system.
   ──────────────────────────────────────────────────────────── */

export type AccentId = 'aurora' | 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose';

export interface AccentPreset {
  id: AccentId;
  name: string;
  // Light mode values (HSL triplets without the `hsl()` wrapper)
  light: { violet: string; cyan: string; indigo: string; primary: string; ring: string };
  // Dark mode (brighter, more saturated)
  dark:  { violet: string; cyan: string; indigo: string; primary: string; ring: string };
  // Visual swatch — two stops for the gradient preview
  swatch: [string, string];
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    light: { violet: '262 83% 58%', cyan: '187 96% 38%', indigo: '244 55% 60%', primary: '262 83% 58%', ring: '262 83% 58%' },
    dark:  { violet: '263 78% 68%', cyan: '187 96% 55%', indigo: '244 55% 65%', primary: '263 78% 68%', ring: '263 78% 68%' },
    swatch: ['#8B5CF6', '#22D3EE'],
  },
  {
    id: 'indigo',
    name: 'Indigo Drift',
    light: { violet: '244 75% 55%', cyan: '217 91% 60%', indigo: '232 70% 55%', primary: '244 75% 55%', ring: '244 75% 55%' },
    dark:  { violet: '244 80% 70%', cyan: '217 91% 70%', indigo: '232 75% 70%', primary: '244 80% 70%', ring: '244 80% 70%' },
    swatch: ['#6366F1', '#3B82F6'],
  },
  {
    id: 'cyan',
    name: 'Cyan Pulse',
    light: { violet: '187 90% 42%', cyan: '199 92% 48%', indigo: '174 72% 45%', primary: '187 90% 42%', ring: '187 90% 42%' },
    dark:  { violet: '187 95% 55%', cyan: '199 94% 60%', indigo: '174 78% 55%', primary: '187 95% 55%', ring: '187 95% 55%' },
    swatch: ['#06B6D4', '#14B8A6'],
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    light: { violet: '160 70% 38%', cyan: '142 70% 45%', indigo: '170 65% 42%', primary: '160 70% 38%', ring: '160 70% 38%' },
    dark:  { violet: '160 75% 55%', cyan: '142 75% 60%', indigo: '170 70% 58%', primary: '160 75% 55%', ring: '160 75% 55%' },
    swatch: ['#10B981', '#22C55E'],
  },
  {
    id: 'amber',
    name: 'Amber Glow',
    light: { violet: '32 95% 50%', cyan: '15 90% 55%', indigo: '25 88% 52%', primary: '32 95% 48%', ring: '32 95% 48%' },
    dark:  { violet: '32 95% 60%', cyan: '15 92% 65%', indigo: '25 92% 62%', primary: '32 95% 60%', ring: '32 95% 60%' },
    swatch: ['#F59E0B', '#F97316'],
  },
  {
    id: 'rose',
    name: 'Rose Quartz',
    light: { violet: '335 80% 55%', cyan: '350 88% 60%', indigo: '320 70% 55%', primary: '335 80% 55%', ring: '335 80% 55%' },
    dark:  { violet: '335 82% 68%', cyan: '350 90% 72%', indigo: '320 75% 68%', primary: '335 82% 68%', ring: '335 82% 68%' },
    swatch: ['#EC4899', '#F43F5E'],
  },
];

/* ────────────────────────────────────────────────────────────
   RECENTLY-VIEWED — a rolling 5-item list of entities the user
   has touched. Persists across sessions, surfaced in the
   command palette + greeting bar pill row.
   ──────────────────────────────────────────────────────────── */

export type RecentEntityType = 'lead' | 'contact' | 'agent' | 'conversation' | 'campaign' | 'page';

export interface RecentItem {
  id: string;             // composite: `${type}:${entityId}` — dedupe key
  type: RecentEntityType;
  title: string;
  subtitle?: string;
  route: string;          // path to navigate to
  icon?: string;          // optional lucide-react icon name
  ts: number;             // unix ms — for ordering
}

const MAX_RECENT = 5;
const STORAGE_ACCENT = 'agentconnect.accent';
const STORAGE_RECENTS = 'agentconnect.recents';

interface PersonalizationContextValue {
  accentId: AccentId;
  setAccent: (id: AccentId) => void;
  preset: AccentPreset;
  recents: RecentItem[];
  addRecent: (item: Omit<RecentItem, 'ts'>) => void;
  clearRecents: () => void;
}

const PersonalizationContext = createContext<PersonalizationContextValue | null>(null);

/* ────────────────────────────────────────────────────────────
   APPLY ACCENT — write CSS custom properties to document root.
   Runs once on mount + every accent change. Adapts to current
   light/dark mode by observing `.dark` class on <html>.
   ──────────────────────────────────────────────────────────── */
function applyAccent(preset: AccentPreset) {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  const palette = isDark ? preset.dark : preset.light;
  root.style.setProperty('--aurora-violet', palette.violet);
  root.style.setProperty('--aurora-cyan',   palette.cyan);
  root.style.setProperty('--aurora-indigo', palette.indigo);
  root.style.setProperty('--primary',       palette.primary);
  root.style.setProperty('--ring',          palette.ring);
  root.style.setProperty('--sidebar-primary', palette.primary);
  root.style.setProperty('--sidebar-ring',    palette.ring);
}

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const [accentId, setAccentIdState] = useState<AccentId>(() => {
    const stored = localStorage.getItem(STORAGE_ACCENT);
    if (stored && ACCENT_PRESETS.find(p => p.id === stored)) return stored as AccentId;
    return 'aurora';
  });

  const [recents, setRecents] = useState<RecentItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_RECENTS);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
    } catch {
      return [];
    }
  });

  const preset = ACCENT_PRESETS.find(p => p.id === accentId) ?? ACCENT_PRESETS[0];

  // Apply accent on mount + whenever accent changes
  useEffect(() => {
    applyAccent(preset);
  }, [preset]);

  // Re-apply when theme (light/dark) toggles — observe class changes on <html>
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => applyAccent(preset));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [preset]);

  const setAccent = useCallback((id: AccentId) => {
    setAccentIdState(id);
    localStorage.setItem(STORAGE_ACCENT, id);
  }, []);

  const addRecent = useCallback((item: Omit<RecentItem, 'ts'>) => {
    setRecents(prev => {
      const next = [{ ...item, ts: Date.now() }, ...prev.filter(r => r.id !== item.id)].slice(0, MAX_RECENT);
      try { localStorage.setItem(STORAGE_RECENTS, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    localStorage.removeItem(STORAGE_RECENTS);
  }, []);

  return (
    <PersonalizationContext.Provider value={{ accentId, setAccent, preset, recents, addRecent, clearRecents }}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error('usePersonalization must be used within PersonalizationProvider');
  return ctx;
}

/** Convenience: pull just recents tracking (most components need only addRecent). */
export function useTrackRecent() {
  return usePersonalization().addRecent;
}
