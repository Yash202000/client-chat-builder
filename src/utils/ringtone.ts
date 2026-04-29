const getId = () => document.getElementById('global-ringtone') as HTMLAudioElement | null;

export function startRingtone() {
  const el = getId();
  if (!el) return;
  el.currentTime = 0;
  el.loop = true;
  el.play().catch(() => {});
}

export function stopRingtone() {
  const el = getId();
  if (!el) return;
  el.pause();
  el.currentTime = 0;
}
