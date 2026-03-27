import type { Item } from '../../protocol.js'

type Listener = (items: Item[]) => void

const listeners = new Map<string, Set<Listener>>()

export function subscribe(listId: string, listener: Listener): () => void {
  if (!listeners.has(listId)) listeners.set(listId, new Set())
  listeners.get(listId)!.add(listener)
  return () => {
    const set = listeners.get(listId)
    if (set) {
      set.delete(listener)
      if (set.size === 0) listeners.delete(listId)
    }
  }
}

export function broadcast(listId: string, items: Item[]): void {
  listeners.get(listId)?.forEach((fn) => fn(items))
}
