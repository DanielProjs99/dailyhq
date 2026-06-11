import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { queries } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(express.json());

// Historia ostatnich prowadzących (w pamięci – zerowana przy restarcie serwera)
const recentLeaders = [];

// Rozsyła aktualny stan zespołu do wszystkich podłączonych klientów
function broadcastState() {
  io.emit('state', queries.all());
}

// ── REST API ──────────────────────────────────────────────
app.get('/api/members', (req, res) => {
  res.json(queries.all());
});

app.post('/api/members', (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Imię jest wymagane' });
  const member = queries.create(name);
  broadcastState();
  res.status(201).json(member);
});

app.patch('/api/members/:id', (req, res) => {
  queries.update(Number(req.params.id), req.body || {});
  broadcastState();
  res.json({ ok: true });
});

app.post('/api/members/:id/chocolates', (req, res) => {
  const delta = Number(req.body?.delta);
  if (!Number.isFinite(delta))
    return res.status(400).json({ error: 'delta musi być liczbą' });
  queries.addChocolates(Number(req.params.id), delta);
  broadcastState();
  res.json({ ok: true });
});

app.delete('/api/members/:id', (req, res) => {
  queries.remove(Number(req.params.id));
  broadcastState();
  res.json({ ok: true });
});

// Zakręcenie kołem – nadawane do wszystkich, żeby cały zespół widział wynik
app.post('/api/spin', (req, res) => {
  const winnerId = Number(req.body?.winnerId);
  const member = queries.all().find((m) => m.id === winnerId);
  io.emit('spin', { winnerId, at: Date.now() });
  if (member) {
    recentLeaders.unshift({ name: member.name, role: member.role });
    recentLeaders.length = Math.min(recentLeaders.length, 8);
    io.emit('recent', recentLeaders);
  }
  res.json({ ok: true });
});

// ── Serwowanie zbudowanego frontendu (produkcja) ──────────
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(join(clientDist, 'index.html')));
}

// ── WebSocket ─────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.emit('state', queries.all());
  socket.emit('recent', recentLeaders);
});

httpServer.listen(PORT, () => {
  console.log(`🍫 CzekoLos działa na http://localhost:${PORT}`);
});
