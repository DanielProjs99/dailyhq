import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Na Renderze (i innych hostingach) wskaż DATA_DIR na trwały dysk,
// np. /var/data – inaczej baza znika przy każdym deployu/restarcie.
const dataDir = process.env.DATA_DIR || join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, 'czekolos.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL,
    active     INTEGER NOT NULL DEFAULT 1,
    chocolates INTEGER NOT NULL DEFAULT 0,
    role       TEXT    NOT NULL DEFAULT 'dev',
    sort       INTEGER NOT NULL DEFAULT 0
  );
`);

// Migracja dla istniejących baz – dodaj kolumnę role, jeśli jej nie ma
try {
  db.exec("ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'dev'");
} catch {
  /* kolumna już istnieje */
}

// Paleta kolorów segmentów koła (spójna z marką cyberFolks – słonecznikowa żółć + ciepłe akcenty)
const PALETTE = [
  '#FFC700', '#FF8A3D', '#E84855', '#7B2D8E',
  '#2E86AB', '#3DBE8B', '#F25F5C', '#5C3A21',
  '#FFB200', '#9B59B6', '#1ABC9C', '#E67E22',
];

function pickColor() {
  const row = db.prepare('SELECT COUNT(*) AS c FROM members').get();
  return PALETTE[row.c % PALETTE.length];
}

export const queries = {
  all() {
    return db
      .prepare('SELECT * FROM members ORDER BY sort ASC, id ASC')
      .all()
      .map((m) => ({ ...m, active: !!m.active }));
  },

  create(name) {
    const maxSort =
      db.prepare('SELECT COALESCE(MAX(sort), 0) AS m FROM members').get().m;
    const info = db
      .prepare('INSERT INTO members (name, color, sort) VALUES (?, ?, ?)')
      .run(name.trim(), pickColor(), maxSort + 1);
    return db
      .prepare('SELECT * FROM members WHERE id = ?')
      .get(info.lastInsertRowid);
  },

  update(id, fields) {
    const allowed = ['name', 'color', 'active', 'role'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (key in fields) {
        sets.push(`${key} = ?`);
        values.push(key === 'active' ? (fields[key] ? 1 : 0) : fields[key]);
      }
    }
    if (sets.length) {
      values.push(id);
      db.prepare(`UPDATE members SET ${sets.join(', ')} WHERE id = ?`).run(
        ...values,
      );
    }
  },

  addChocolates(id, delta) {
    db.prepare(
      'UPDATE members SET chocolates = MAX(0, chocolates + ?) WHERE id = ?',
    ).run(delta, id);
  },

  remove(id) {
    db.prepare('DELETE FROM members WHERE id = ?').run(id);
  },
};
