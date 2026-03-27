import { writeFile, rename, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Entry, Store } from './store.js'

export async function atomicWrite(path: string, data: unknown): Promise<void> {
  const tmp = `${path}.${randomUUID()}.tmp`
  await writeFile(tmp, JSON.stringify(data), 'utf-8')
  await rename(tmp, path)
}

export async function loadAll(dataDir: string): Promise<Map<string, Entry>> {
  const map = new Map<string, Entry>()

  let files: string[]
  try {
    files = await readdir(dataDir)
  } catch {
    return map
  }

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const raw = await readFile(join(dataDir, file), 'utf-8')
      const entry = JSON.parse(raw) as Entry
      map.set(entry.list.id, entry)
    } catch {
      // Skip malformed files — don't crash on bad data
    }
  }

  return map
}

// Returns a persist function that serialises writes per list via a promise chain.
// Writing always snapshots the latest store state, so rapid mutations
// collapse into fewer writes rather than writing stale intermediate states.
export function createPersister(dataDir: string, store: Store) {
  const queues = new Map<string, Promise<void>>()

  return function persist(listId: string): void {
    const prev = queues.get(listId) ?? Promise.resolve()
    const next = prev
      .then(() => {
        const entry = store.getEntry(listId)
        if (entry) return atomicWrite(join(dataDir, `${listId}.json`), entry)
      })
      .catch((err) => console.error(`[persist] failed to write list ${listId}:`, err))
    queues.set(listId, next)
  }
}
