import type { Db } from './client.js'
import type { Item } from '../../protocol.js'

type ItemRow = {
  id: string
  list_id: string
  text: string
  checked: number
  created_at: string
  updated_at: string
}

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    listId: row.list_id,
    text: row.text,
    checked: row.checked === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createItem(
  db: Db,
  item: { id: string; listId: string; text: string; createdAt: string; updatedAt: string },
): Item {
  db.prepare(
    'INSERT INTO items (id, list_id, text, checked, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
  ).run(item.id, item.listId, item.text, item.createdAt, item.updatedAt)
  return { id: item.id, listId: item.listId, text: item.text, checked: false, createdAt: item.createdAt, updatedAt: item.updatedAt }
}

export function getItems(db: Db, listId: string): Item[] {
  const rows = db
    .prepare('SELECT * FROM items WHERE list_id = ? ORDER BY created_at ASC')
    .all(listId) as ItemRow[]
  return rows.map(rowToItem)
}

export function getItem(db: Db, id: string): Item | null {
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow | undefined
  return row ? rowToItem(row) : null
}

export function updateItem(
  db: Db,
  id: string,
  patch: { text?: string; checked?: boolean; updatedAt: string },
): Item | null {
  const current = getItem(db, id)
  if (!current) return null

  const text = patch.text ?? current.text
  const checked = patch.checked ?? current.checked

  db.prepare('UPDATE items SET text = ?, checked = ?, updated_at = ? WHERE id = ?').run(
    text,
    checked ? 1 : 0,
    patch.updatedAt,
    id,
  )

  return { ...current, text, checked, updatedAt: patch.updatedAt }
}

export function deleteItem(db: Db, id: string): boolean {
  const result = db.prepare('DELETE FROM items WHERE id = ?').run(id)
  return result.changes > 0
}
