import Database from 'better-sqlite3'

export type Db = Database.Database

export function createDatabase(path: string = ':memory:'): Db {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  applySchema(db)
  return db
}

function applySchema(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id         TEXT PRIMARY KEY,
      list_id    TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      text       TEXT NOT NULL,
      checked    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}
