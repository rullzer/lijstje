import type { Item } from '../protocol.js'

type SSEOptions = {
  onItems: (items: Item[]) => void
  onStatusChange: (online: boolean) => void
}

export function connectSSE(listId: string, { onItems, onStatusChange }: SSEOptions): () => void {
  let es: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function connect() {
    es?.close()
    es = new EventSource(`/api/lists/${listId}/stream`)

    es.addEventListener('items', (e: MessageEvent) => {
      const { items } = JSON.parse(e.data) as { items: Item[] }
      onStatusChange(true)
      onItems(items)
    })

    es.addEventListener('error', () => {
      onStatusChange(false)
      es?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(connect, 3_000)
    })

    es.addEventListener('open', () => onStatusChange(true))
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') connect()
  })

  window.addEventListener('online', connect)

  connect()

  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    es?.close()
  }
}
