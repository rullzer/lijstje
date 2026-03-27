import type { List, Item } from '../../protocol.js'

export type Entry = { list: List; items: Item[] }

export type Store = ReturnType<typeof createStore>

export function createStore(initial: Map<string, Entry> = new Map()) {
  const data = new Map<string, Entry>(initial)

  return {
    createList(list: List): List {
      data.set(list.id, { list, items: [] })
      return list
    },

    getList(id: string): List | null {
      return data.get(id)?.list ?? null
    },

    listExists(id: string): boolean {
      return data.has(id)
    },

    createItem(item: Item): Item {
      data.get(item.listId)?.items.push(item)
      return item
    },

    getItems(listId: string): Item[] {
      return data.get(listId)?.items ?? []
    },

    updateItem(
      listId: string,
      itemId: string,
      patch: { text?: string; checked?: boolean; updatedAt: string },
    ): Item | null {
      const entry = data.get(listId)
      if (!entry) return null
      const idx = entry.items.findIndex((i) => i.id === itemId)
      if (idx === -1) return null
      entry.items[idx] = { ...entry.items[idx], ...patch }
      return entry.items[idx]
    },

    deleteItem(listId: string, itemId: string): boolean {
      const entry = data.get(listId)
      if (!entry) return false
      const before = entry.items.length
      entry.items = entry.items.filter((i) => i.id !== itemId)
      return entry.items.length < before
    },

    // Used by the persister to snapshot the current entry for a list
    getEntry(listId: string): Entry | null {
      return data.get(listId) ?? null
    },
  }
}
