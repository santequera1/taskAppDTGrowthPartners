export const playPomodoroSound = () => {
  try {
    // Try Web Audio API beep
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        if (ctx.close) ctx.close();
      }, 250);
      return;
    }
  } catch (e) {
    // fallthrough
  }

  // Fallback: short audio using data URI (tiny beep)
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
    audio.play().catch(() => {});
  } catch (e) {}
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {
      // ignore
    }
  }
};

export const showPomodoroNotification = (title: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification('🍅 Pomodoro completado', {
        body: title,
      });
    } catch (e) {}
  }
};
