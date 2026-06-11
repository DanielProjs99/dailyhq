import React, { useState } from 'react';
import { api } from '../api.js';
import { ROLES, ROLE_KEYS } from '../roles.js';

export default function TeamManager({ members }) {
  const [name, setName] = useState('');

  async function add(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    await api.addMember(n);
    setName('');
  }

  return (
    <section className="card">
      <h2>👥 Zespół</h2>

      <form className="add-form" onSubmit={add}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Imię nowej osoby"
          maxLength={30}
        />
        <button className="btn btn-primary" type="submit">
          Dodaj
        </button>
      </form>

      <ul className="team-list">
        {members.map((m) => (
          <li key={m.id} className="team-row">
            <label className="team-toggle" title="Bierze udział w losowaniu">
              <input
                type="checkbox"
                checked={m.active}
                onChange={(e) =>
                  api.updateMember(m.id, { active: e.target.checked })
                }
              />
              <span className="dot" style={{ background: m.color }} />
              <span className={m.active ? '' : 'inactive'}>{m.name}</span>
            </label>
            <select
              className="role-select"
              value={m.role}
              onChange={(e) => api.updateMember(m.id, { role: e.target.value })}
            >
              {ROLE_KEYS.map((r) => (
                <option key={r} value={r}>
                  {ROLES[r].icon} {ROLES[r].label}
                </option>
              ))}
            </select>
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (confirm(`Usunąć ${m.name}?`)) api.removeMember(m.id);
              }}
              aria-label={`Usuń ${m.name}`}
            >
              Usuń
            </button>
          </li>
        ))}
        {!members.length && <li className="hint">Jeszcze nikogo tu nie ma.</li>}
      </ul>
    </section>
  );
}
