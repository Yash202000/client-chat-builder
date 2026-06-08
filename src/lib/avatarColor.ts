const PALETTE = [
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-white',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-white',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-white',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-white',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-white',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-white',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-white',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-white',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function getAvatarInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
