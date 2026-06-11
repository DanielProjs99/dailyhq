import { io } from 'socket.io-client';

// W dev korzystamy z proxy Vite, w produkcji z tego samego origin co backend
export const socket = io('/', { autoConnect: true });

async function req(path, options) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Błąd serwera');
  return res.json();
}

export const api = {
  addMember: (name) =>
    req('/members', { method: 'POST', body: JSON.stringify({ name }) }),
  updateMember: (id, fields) =>
    req(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }),
  removeMember: (id) => req(`/members/${id}`, { method: 'DELETE' }),
  addChocolates: (id, delta) =>
    req(`/members/${id}/chocolates`, {
      method: 'POST',
      body: JSON.stringify({ delta }),
    }),
  spin: (winnerId) =>
    req('/spin', { method: 'POST', body: JSON.stringify({ winnerId }) }),
};
