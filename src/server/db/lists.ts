import type { Db } from './client.js'
import type { List } from '../../protocol.js'

type ListRow = { id: string; name: string; created_at: string }

function rowToList(row: ListRow): List {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

export function createList(db: Db, list: { id: string; name: string; createdAt: string }): List {
  db.prepare('INSERT INTO lists (id, name, created_at) VALUES (?, ?, ?)').run(
    list.id,
    list.name,
    list.createdAt,
  )
  return { id: list.id, name: list.name, createdAt: list.createdAt }
}

export function getList(db: Db, id: string): List | null {
  const row = db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as ListRow | undefined
  return row ? rowToList(row) : null
}

export function listExists(db: Db, id: string): boolean {
  return db.prepare('SELECT 1 FROM lists WHERE id = ?').get(id) !== undefined
}
