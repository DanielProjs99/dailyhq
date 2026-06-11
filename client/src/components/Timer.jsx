import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../sound.js';

const PRESETS = [10, 15, 20]; // minuty

function fmt(s) {
  const m = Math.floor(Math.abs(s) / 60);
  const sec = Math.abs(s) % 60;
  return `${s < 0 ? '+' : ''}${m}:${String(sec).padStart(2, '0')}`;
}

export default function Timer() {
  const [target, setTarget] = useState(15 * 60);
  const [left, setLeft] = useState(15 * 60);
  const [running, setRunning] = useState(false);
  const buzzed = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l === 1 && !buzzed.current) {
          buzzed.current = true;
          sound.fanfare();
        }
        return l - 1; // schodzi poniżej zera → pokazujemy przekroczenie
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  function set(min) {
    setRunning(false);
    buzzed.current = false;
    setTarget(min * 60);
    setLeft(min * 60);
  }
  function reset() {
    setRunning(false);
    buzzed.current = false;
    setLeft(target);
  }

  const over = left < 0;

  return (
    <section className="card timer-card">
      <h2>⏱️ Timer daily</h2>
      <div className={`timer-display ${over ? 'over' : ''}`}>{fmt(left)}</div>
      <div className="timer-controls">
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pauza' : 'Start'}
        </button>
        <button className="btn" onClick={reset}>
          Reset
        </button>
        {PRESETS.map((m) => (
          <button
            key={m}
            className={`btn ${target === m * 60 ? 'btn-sel' : ''}`}
            onClick={() => set(m)}
          >
            {m} min
          </button>
        ))}
      </div>
      {over && <p className="hint">Przekroczony czas daily 🐢</p>}
    </section>
  );
}
