import { io } from 'socket.io-client';

const TOKEN_KEY = 'daily_token';

export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// W dev korzystamy z proxy Vite, w produkcji z tego samego origin co backend.
// Łączymy się ręcznie dopiero po zalogowaniu (auth.token leci w handshake).
export const socket = io('/', {
  autoConnect: false,
  auth: (cb) => cb({ token: auth.get() }),
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}

async function req(path, options) {
  const token = auth.get();
  const res = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    auth.clear();
    socket.disconnect();
    window.dispatchEvent(new Event('unauthorized'));
  }
  if (!res.ok) throw new Error((await res.json()).error || 'Błąd serwera');
  return res.json();
}

export const api = {
  login: async (password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Błąd logowania');
    const { token } = await res.json();
    auth.set(token);
    return token;
  },
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
