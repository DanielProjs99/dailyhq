import React, { useState } from 'react';
import { api } from '../api.js';
import { roleIcon } from '../roles.js';

export default function Chocolates({ members }) {
  const [copied, setCopied] = useState(false);

  // Ranking „dłużników” – malejąco po liczbie czekolad
  const ranked = [...members].sort(
    (a, b) => b.chocolates - a.chocolates || a.id - b.id,
  );
  const total = members.reduce((s, m) => s + m.chocolates, 0);

  function exportCsv() {
    const rows = [['Osoba', 'Rola', 'Czekolady']];
    ranked.forEach((m) => rows.push([m.name, m.role, String(m.chocolates)]));
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'czekolady.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copySummary() {
    const text = ranked
      .filter((m) => m.chocolates > 0)
      .map((m) => `${m.name}: ${m.chocolates} 🍫`)
      .join('\n');
    await navigator.clipboard.writeText(text || 'Nikt nic nie wisi 🎉');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="card">
      <div className="wheel-head">
        <h2>🍫 Czekolady za spóźnienia</h2>
        <span className="export-btns">
          <button className="btn btn-mini" onClick={copySummary}>
            {copied ? 'Skopiowano ✓' : 'Kopiuj'}
          </button>
          <button className="btn btn-mini" onClick={exportCsv}>
            CSV
          </button>
        </span>
      </div>
      <p className="hint">Razem do oddania: <strong>{total}</strong></p>

      <ul className="choco-list">
        {ranked.map((m, i) => (
          <li key={m.id} className="choco-row">
            <span className="choco-rank">{i + 1}.</span>
            <span className="dot" style={{ background: m.color }} />
            <span className="choco-name">
              {roleIcon(m.role)} {m.name}
            </span>
            <span className="choco-count">{m.chocolates} 🍫</span>
            <span className="choco-actions">
              <button
                className="btn btn-round"
                onClick={() => api.addChocolates(m.id, -1)}
                disabled={m.chocolates === 0}
                aria-label={`Odejmij czekoladę ${m.name}`}
              >
                −
              </button>
              <button
                className="btn btn-round btn-plus"
                onClick={() => api.addChocolates(m.id, 1)}
                aria-label={`Dodaj czekoladę ${m.name}`}
              >
                +
              </button>
            </span>
          </li>
        ))}
        {!members.length && (
          <li className="hint">Brak osób – dodaj zespół poniżej.</li>
        )}
      </ul>
    </section>
  );
}
