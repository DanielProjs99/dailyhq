import React, { useEffect, useState } from 'react';
import { socket, api, auth, connectSocket } from './api.js';
import { sound } from './sound.js';
import Login from './components/Login.jsx';
import Wheel from './components/Wheel.jsx';
import Chocolates from './components/Chocolates.jsx';
import TeamManager from './components/TeamManager.jsx';
import AttendanceBar from './components/AttendanceBar.jsx';
import Timer from './components/Timer.jsx';

export default function App() {
  const [authed, setAuthed] = useState(!!auth.get());
  const [members, setMembers] = useState([]);
  const [spinEvent, setSpinEvent] = useState(null);
  const [recent, setRecent] = useState([]);
  const [connected, setConnected] = useState(socket.connected);
  const [roleFilter, setRoleFilter] = useState('all');
  const [muted, setMuted] = useState(sound.isMuted());

  useEffect(() => {
    if (!authed) return;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      if (err.message === 'unauthorized') logout();
    });
    socket.on('state', setMembers);
    socket.on('spin', setSpinEvent);
    socket.on('recent', setRecent);
    connectSocket();
    return () => socket.off();
  }, [authed]);

  // Wylogowanie wymuszone przez serwer (401 na REST API)
  useEffect(() => {
    window.addEventListener('unauthorized', logout);
    return () => window.removeEventListener('unauthorized', logout);
  }, []);

  function logout() {
    auth.clear();
    socket.disconnect();
    setConnected(false);
    setAuthed(false);
  }

  // uczestnicy losowania: obecni + dopasowani do filtra roli
  const participants = members.filter(
    (m) => m.active && (roleFilter === 'all' || m.role === roleFilter),
  );

  function handleSpinRequest() {
    if (participants.length < 2) return;
    const winner =
      participants[Math.floor(Math.random() * participants.length)];
    api.spin(winner.id);
  }

  // spacja = zakręć (gdy nie piszemy w polu tekstowym)
  useEffect(() => {
    function onKey(e) {
      const tag = e.target.tagName;
      if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'SELECT') {
        e.preventDefault();
        handleSpinRequest();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [participants]);

  function toggleMute() {
    const m = !muted;
    sound.setMuted(m);
    setMuted(m);
  }

  // Wszystkie hooki muszą być wywołane przed tym warunkiem (zasady hooków Reacta).
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <span className="logo">Daily HQ</span> 🎯
        </h1>
        <div className="topbar-right">
          <button className="btn btn-mini" onClick={toggleMute}>
            {muted ? '🔇 dźwięk' : '🔊 dźwięk'}
          </button>
          <button className="btn btn-mini" onClick={logout}>
            🔒 wyloguj
          </button>
          <span className={`status ${connected ? 'on' : 'off'}`}>
            {connected ? 'połączono' : 'offline'}
          </span>
        </div>
      </header>

      <AttendanceBar members={members} />

      <main className="grid">
        <Wheel
          members={participants}
          spinEvent={spinEvent}
          recent={recent}
          roleFilter={roleFilter}
          onRoleFilter={setRoleFilter}
          onSpinRequest={handleSpinRequest}
        />
        <Chocolates members={members} />
        <Timer />
        <TeamManager members={members} />
      </main>

      <footer className="foot">
        Daily HQ · koło prowadzącego, czekolady i timer · dane współdzielone na żywo
      </footer>
    </div>
  );
}
