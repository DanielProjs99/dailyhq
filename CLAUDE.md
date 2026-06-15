# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Co to jest

Daily HQ (paczka `czekolos`) — narzędzie na daily zespołu: koło losujące prowadzącego, licznik czekolad za spóźnienia, obecność, timer. Stan jest **współdzielony na żywo** między wszystkimi klientami przez WebSocket; dostęp chroni jedno wspólne hasło.

## Komendy

```bash
npm run install:all   # instaluje zależności server + client (client z devDependencies)
npm run dev           # backend :3000 + frontend :5173 (Vite proxuje API/WS na :3000)
npm run build         # install:all + build frontendu do client/dist
npm start             # produkcja: backend serwuje API + zbudowany frontend na jednym porcie
```

- Brak testów i lintera w repo.
- Wymaga **Node.js 24** (`engines.node`, `.nvmrc`). Backend używa `node:sqlite` — działa bez flag od Node 24.
- Lokalnie z hasłem: `APP_PASSWORD="..." npm start` (domyślne `daily`).

## Architektura

Monorepo: root `package.json` orkiestruje dwa pakiety przez `--prefix server` / `--prefix client`. **Root jest punktem wejścia dla buildu i startu** (istotne dla hostingu).

**Backend** (`server/`, ESM, `type: module`) — `src/index.js` to jeden plik z Express + Socket.IO. Punkty kluczowe:
- Auth: hasło `APP_PASSWORD` → token = SHA-256 hasła (`AUTH_TOKEN`). Ten sam token chroni REST (`Authorization: Bearer`) i WebSocket (handshake `auth.token`). Porównania przez `timingSafeEqual`. Hasło samo nie krąży po sieci.
- Każda mutacja stanu woła `broadcastState()` → `io.emit('state', ...)`, więc wszyscy klienci są synchronizowani. `recentLeaders` trzymane w pamięci (giną przy restarcie).
- Po API serwuje `client/dist` jako statyk + SPA fallback na `index.html` (tylko gdy katalog istnieje, tj. po buildzie).
- Nasłuchuje na `process.env.PORT` (domyślnie 3000).

**Baza** (`server/src/db.js`) — `node:sqlite` (`DatabaseSync`), plik w `DATA_DIR` (domyślnie `server/data/`, nie w repo). Eksportuje obiekt `queries` (CRUD na `members`). Migracje robione defensywnie przez `ALTER TABLE` w `try/catch`. SQLite = single-writer, **nie działa z `replicas ≥ 2`**.

**Frontend** (`client/`, React + Vite) — `src/api.js` centralizuje całą komunikację: `auth` (token w `localStorage`), pojedynczy `socket` (łączony ręcznie po zalogowaniu), helper `req()`. Przy 401 czyści token i emituje globalny event `unauthorized`. W dev Vite proxuje `/api` i `/socket.io` na `:3000`; w produkcji ten sam origin co backend. Komponenty w `src/components/` (Wheel, Chocolates, Timer, AttendanceBar, TeamManager, Login).

## Deployment (cyberFolks App Platform)

Deploy z repo Git, preset Node.js 24 — platforma buduje obraz buildpackiem, **`Dockerfile` nie jest używany** (zostaje dla innych hostingów). Wymagane ustawienia w panelu:
- `BP_NODE_RUN_SCRIPTS=build` — inaczej frontend się nie zbuduje (serwer odda samo API).
- Wolumen zamontowany pod `/data` + `DATA_DIR=/data` — inaczej baza SQLite znika przy każdym deployu.
- `APP_PASSWORD` jako *Secret variable*, `NODE_ENV=production`.
