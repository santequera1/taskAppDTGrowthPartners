export const formatSeconds = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const msToSeconds = (ms: number | undefined) => {
  if (!ms) return 25 * 60;
  return Math.ceil(ms / 1000);
};

export const secondsToMs = (s: number) => s * 1000;

export const generateId = () => {
  // simple unique id
  return Math.random().toString(36).slice(2, 9);
};
