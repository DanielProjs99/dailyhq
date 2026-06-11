import React, { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.login(password);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Nie udało się zalogować');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <h1>
          <span className="logo">Daily HQ</span> 🎯
        </h1>
        <p className="login-hint">Podaj hasło zespołu, żeby wejść.</p>
        <input
          type="password"
          autoFocus
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="login-error">{error}</div>}
        <button className="btn" type="submit" disabled={busy || !password}>
          {busy ? 'Logowanie…' : 'Wejdź'}
        </button>
      </form>
    </div>
  );
}
