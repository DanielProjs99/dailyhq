# Daily HQ 🎯

Narzędzie na daily zespołu (dev / front / qa / pm):

- **🎡 Koło prowadzącego** – w pełni losowo wybiera, kto prowadzi spotkanie (konfetti, dźwięk, filtr po roli).
- **🍫 Licznik czekolad** – ile czekolad każdy „wisi” za spóźnienia (ręczne +/−), ranking i eksport CSV/kopiowanie.
- **✅ Obecność** – jednym klikiem oznaczasz kto jest dziś (pomijanie nieobecnych w losowaniu).
- **⏱️ Timer daily** – odliczanie czasu spotkania (10/15/20 min).
- **👥 Zespół** – dodawanie/usuwanie osób, role, historia prowadzących.

Dane są **współdzielone na żywo** (WebSocket) – wszyscy widzą ten sam stan.
Dostęp chroni **wspólne hasło zespołu**, baza w pliku SQLite (wbudowany `node:sqlite`, zero kompilacji).

## Hasło dostępu

Aplikacja jest za jednym wspólnym hasłem. Ustaw je zmienną środowiskową `APP_PASSWORD`
(domyślnie `daily` – zmień przed wystawieniem na świat). Token logowania to pochodna
hasła (SHA-256), trzymana w `localStorage`; chroni zarówno REST API, jak i WebSocket.

```bash
APP_PASSWORD="twoje-haslo" npm start
```

## Stack

- Backend: Node.js + Express + Socket.IO + `node:sqlite`
- Frontend: React + Vite

## Uruchomienie lokalne (dev)

```bash
npm run install:all          # instaluje zależności server + client
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
pm2 start server/src/index.js --name daily-hq --env PORT=3000
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

Baza: `server/data/czekolos.db` (nie jest w repo). Backup = skopiowanie tego pliku.

Ścieżkę katalogu z bazą można zmienić zmienną `DATA_DIR` (np. na trwały dysk hostingu):

```bash
DATA_DIR=/var/data npm start
```

### Hosting kontenerowy: trwałość danych

System plików kontenera jest zwykle **ulotny** – przy każdym deployu/restarcie startuje
od zera, więc baza w katalogu aplikacji znika. Aby dane przetrwały, podepnij **trwały
wolumen** i ustaw `DATA_DIR` na jego ścieżkę (np. `/data`).

Na **cyberFolks App Platform** wolumen tworzysz w zakładce *Volumes* projektu/aplikacji,
a `DATA_DIR` ustawiasz w *Variables*. Obraz budowany jest z `Dockerfile` i uruchamiany
w trybie *Container image*.
