# CzekoLos 🍫🎡

Narzędzie na daily zespołu:

- **🎡 Koło prowadzącego** – w pełni losowo wybiera, kto prowadzi spotkanie.
- **🍫 Licznik czekolad** – ile czekolad każdy „wisi” za spóźnienia (ręczne +/−).
- **👥 Zespół** – dodawanie/usuwanie osób, oznaczanie kto bierze udział w losowaniu.

Dane są **współdzielone na żywo** (WebSocket) – wszyscy widzą ten sam stan.
Bez logowania, baza w pliku SQLite (wbudowany `node:sqlite`, zero kompilacji).

## Stack

- Backend: Node.js + Express + Socket.IO + `node:sqlite`
- Frontend: React + Vite

## Uruchomienie lokalne (dev)

```bash
npm run install:all          # instaluje zależności server + client
# w dwóch terminalach albo:
npm run dev                  # backend :3000 + frontend :5173
```

Otwórz http://localhost:5173 (frontend proxuje API i WebSocket do backendu).

## Produkcja / VPS firmowy

```bash
npm run install:all
npm run build                # buduje frontend do client/dist
PORT=3000 npm start          # backend serwuje API + gotowy frontend
```

Aplikacja działa wtedy na jednym porcie (domyślnie `3000`).

### Utrzymanie procesu (pm2)

```bash
npm i -g pm2
pm2 start server/src/index.js --name czekolos --env PORT=3000
pm2 save && pm2 startup       # autostart po restarcie serwera
```

### Opcjonalnie za nginx

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;   # WebSocket
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## Dane

Baza: `server/data/czekolos.db`. Backup = skopiowanie tego pliku.
