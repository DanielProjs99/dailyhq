import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../sound.js';
import { ROLES, ROLE_KEYS, roleIcon } from '../roles.js';

const SIZE = 360;
const R = SIZE / 2;

function drawWheel(canvas, members) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  if (!members.length) return;

  const seg = (2 * Math.PI) / members.length;
  const start = -Math.PI / 2;

  members.forEach((m, i) => {
    const a0 = start + i * seg;
    const a1 = a0 + seg;

    ctx.beginPath();
    ctx.moveTo(R, R);
    ctx.arc(R, R, R - 4, a0, a1);
    ctx.closePath();
    ctx.fillStyle = m.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(R, R);
    ctx.rotate(a0 + seg / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '600 15px system-ui, sans-serif';
    const label = m.name.length > 11 ? m.name.slice(0, 10) + '…' : m.name;
    ctx.fillText(`${roleIcon(m.role)} ${label}`, R - 20, 5);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(R, R, 26, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#FFC700';
  ctx.lineWidth = 4;
  ctx.stroke();
}

// Tiki o malejącej częstotliwości – „spowalnianie” koła
function scheduleTicks() {
  const timers = [];
  const N = 28;
  for (let i = 0; i < N; i++) {
    const p = i / N;
    const t = 5000 * (1 - Math.pow(1 - p, 2.2)); // szybko na starcie, wolno na końcu
    timers.push(setTimeout(() => sound.tick(), t));
  }
  return timers;
}

export default function Wheel({
  members,
  spinEvent,
  recent,
  roleFilter,
  onRoleFilter,
  onSpinRequest,
}) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerId, setWinnerId] = useState(null);
  const lastSpinAt = useRef(0);

  // Lista „Ostatnio" – wstrzymana, dopóki koło się kręci, żeby zwycięzca
  // nie pojawił się tam przed zatrzymaniem animacji.
  const spinningRef = useRef(false);
  const latestRecent = useRef(recent);
  const [displayRecent, setDisplayRecent] = useState(recent);

  useEffect(() => {
    drawWheel(canvasRef.current, members);
  }, [members]);

  useEffect(() => {
    latestRecent.current = recent;
    if (!spinningRef.current) setDisplayRecent(recent);
  }, [recent]);

  useEffect(() => {
    if (!spinEvent || spinEvent.at === lastSpinAt.current) return;
    lastSpinAt.current = spinEvent.at;

    const idx = members.findIndex((m) => m.id === spinEvent.winnerId);
    if (idx < 0) return;

    spinningRef.current = true;
    setWinnerId(null);
    setSpinning(true);
    const ticks = scheduleTicks();

    const segDeg = 360 / members.length;
    const winnerCenter = (idx + 0.5) * segDeg;
    const targetMod = (360 - winnerCenter) % 360;
    const jitter = (Math.random() - 0.5) * (segDeg - 8);
    setRotation((prev) => {
      const add = ((targetMod - (prev % 360) + 360) % 360) + 360 * 6 + jitter;
      return prev + add;
    });

    return () => ticks.forEach(clearTimeout);
  }, [spinEvent, members]);

  function handleEnd() {
    if (!spinning) return;
    setSpinning(false);
    spinningRef.current = false;
    setWinnerId(spinEvent?.winnerId ?? null);
    setDisplayRecent(latestRecent.current); // dopiero teraz pokaż zwycięzcę w „Ostatnio"
    sound.fanfare();
    confetti({ particleCount: 140, spread: 75, origin: { y: 0.4 } });
  }

  const winner = members.find((m) => m.id === winnerId);
  const canSpin = members.length >= 2;

  return (
    <section className="card wheel-card">
      <div className="wheel-head">
        <h2>🎡 Koło prowadzącego</h2>
        <label className="role-filter">
          Losuj spośród:
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilter(e.target.value)}
          >
            <option value="all">wszyscy</option>
            {ROLE_KEYS.map((r) => (
              <option key={r} value={r}>
                {ROLES[r].icon} {ROLES[r].label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="wheel-stage">
        <div className="wheel-pointer" />
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="wheel-canvas"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              : 'none',
          }}
          onTransitionEnd={handleEnd}
        />
      </div>

      <button
        className="btn btn-primary btn-spin"
        disabled={spinning || !canSpin}
        onClick={onSpinRequest}
      >
        {spinning ? 'Kręci się…' : 'Zakręć kołem'}
      </button>
      <p className="hint kbd-hint">albo naciśnij spację</p>

      {!canSpin && (
        <p className="hint">Potrzeba min. 2 osób w tej kategorii.</p>
      )}

      {winner && !spinning && (
        <div className="winner-banner" style={{ borderColor: winner.color }}>
          Dziś prowadzi: <strong>{roleIcon(winner.role)} {winner.name}</strong> 🎉
        </div>
      )}

      {displayRecent.length > 0 && (
        <div className="recent">
          <span className="recent-label">Ostatnio:</span>
          {displayRecent.slice(0, 5).map((r, i) => (
            <span key={i} className="recent-chip">
              {roleIcon(r.role)} {r.name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
