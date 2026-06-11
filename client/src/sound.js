// Proste dźwięki generowane Web Audio API – bez plików audio.
// Wyciszenie zapamiętywane w localStorage.

let ctx = null;
function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const sound = {
  isMuted() {
    return localStorage.getItem('czekolos:muted') === '1';
  },
  setMuted(m) {
    localStorage.setItem('czekolos:muted', m ? '1' : '0');
  },

  // krótkie „tik” – odtwarzane podczas kręcenia koła
  tick() {
    if (this.isMuted()) return;
    const c = audioCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.05, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.05);
  },

  // fanfara na wyłonienie zwycięzcy
  fanfare() {
    if (this.isMuted()) return;
    const c = audioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.35);
    });
  },
};
