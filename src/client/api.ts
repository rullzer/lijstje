import type { ListWithItems, Item } from '../protocol.js'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json()
    throw new Error(body.error ?? res.statusText)
  }
  return res.json()
}

export const getList = (id: string): Promise<ListWithItems> =>
  fetch(`/api/lists/${id}`).then((r) => json<ListWithItems>(r))

export const addItem = (listId: string, text: string): Promise<Item> =>
  fetch(`/api/lists/${listId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).then((r) => json<Item>(r))

export const updateItem = (
  listId: string,
  itemId: string,
  patch: { text?: string; checked?: boolean },
): Promise<Item> =>
  fetch(`/api/lists/${listId}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then((r) => json<Item>(r))

export const deleteItem = (listId: string, itemId: string): Promise<void> =>
  fetch(`/api/lists/${listId}/items/${itemId}`, { method: 'DELETE' }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? res.statusText)
    }
  })
