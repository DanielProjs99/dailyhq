import React from 'react';
import { api } from '../api.js';
import { roleIcon } from '../roles.js';

// Szybkie oznaczanie obecności – kliknięcie przełącza udział w losowaniu
export default function AttendanceBar({ members }) {
  if (!members.length) return null;

  const allPresent = members.every((m) => m.active);

  return (
    <section className="attendance">
      <span className="attendance-label">Obecność dziś:</span>
      {members.map((m) => (
        <button
          key={m.id}
          className={`att-chip ${m.active ? 'present' : 'absent'}`}
          style={m.active ? { borderColor: m.color } : undefined}
          onClick={() => api.updateMember(m.id, { active: !m.active })}
          title={m.active ? 'obecny – kliknij, by pominąć' : 'nieobecny'}
        >
          {roleIcon(m.role)} {m.name}
        </button>
      ))}
      <button
        className="btn btn-mini"
        onClick={() =>
          members.forEach((m) => api.updateMember(m.id, { active: !allPresent }))
        }
      >
        {allPresent ? 'Odznacz wszystkich' : 'Wszyscy obecni'}
      </button>
    </section>
  );
}
