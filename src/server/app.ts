import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Store } from './store/store.js'
import { validateName, validateText, validatePatch } from './lib/validation.js'
import { subscribe, broadcast } from './lib/broadcaster.js'

export function createApp(store: Store, persist: (listId: string) => void, createSecret?: string) {
  const app = new Hono()

  // --- Static client files ---

  app.use('/js/*', serveStatic({ root: './client' }))

  app.get('/', (c) => {
    const html = readFileSync(join(process.cwd(), 'client', 'index.html'), 'utf-8')
    return c.html(html)
  })

  app.get('/list/:id', (c) => {
    const html = readFileSync(join(process.cwd(), 'client', 'list.html'), 'utf-8')
    return c.html(html)
  })

  // --- API ---

  app.post('/api/lists', async (c) => {
    if (createSecret && c.req.header('X-Create-Secret') !== createSecret) {
      return c.json({ error: 'invalid or missing secret' }, 401)
    }

    const body = await c.req.json()
    const result = validateName(body?.name)
    if (!result.ok) return c.json({ error: result.error }, 400)

    const list = store.createList({
      id: crypto.randomUUID(),
      name: result.value,
      createdAt: new Date().toISOString(),
    })
    persist(list.id)
    return c.json(list, 201)
  })

  app.get('/api/lists/:id', (c) => {
    const list = store.getList(c.req.param('id'))
    if (!list) return c.json({ error: 'list not found' }, 404)
    return c.json({ ...list, items: store.getItems(list.id) })
  })

  app.post('/api/lists/:id/items', async (c) => {
    const listId = c.req.param('id')
    if (!store.listExists(listId)) return c.json({ error: 'list not found' }, 404)

    const body = await c.req.json()
    const result = validateText(body?.text)
    if (!result.ok) return c.json({ error: result.error }, 400)

    const now = new Date().toISOString()
    const item = store.createItem({
      id: crypto.randomUUID(),
      listId,
      text: result.value,
      checked: false,
      createdAt: now,
      updatedAt: now,
    })

    persist(listId)
    broadcast(listId, store.getItems(listId))
    return c.json(item, 201)
  })

  app.patch('/api/lists/:id/items/:itemId', async (c) => {
    const listId = c.req.param('id')
    if (!store.listExists(listId)) return c.json({ error: 'list not found' }, 404)

    const body = await c.req.json()
    const result = validatePatch(body)
    if (!result.ok) return c.json({ error: result.error }, 400)

    const item = store.updateItem(listId, c.req.param('itemId'), {
      ...result.value,
      updatedAt: new Date().toISOString(),
    })
    if (!item) return c.json({ error: 'item not found' }, 404)

    persist(listId)
    broadcast(listId, store.getItems(listId))
    return c.json(item)
  })

  app.delete('/api/lists/:id/items/:itemId', (c) => {
    const listId = c.req.param('id')
    if (!store.listExists(listId)) return c.json({ error: 'list not found' }, 404)

    const deleted = store.deleteItem(listId, c.req.param('itemId'))
    if (!deleted) return c.json({ error: 'item not found' }, 404)

    persist(listId)
    broadcast(listId, store.getItems(listId))
    return new Response(null, { status: 204 })
  })

  // --- SSE stream ---

  app.get('/api/lists/:id/stream', (c) => {
    const listId = c.req.param('id')
    if (!store.listExists(listId)) return c.json({ error: 'list not found' }, 404)

    return streamSSE(c, async (stream) => {
      let closed = false
      stream.onAbort(() => { closed = true })

      await stream.writeSSE({
        event: 'items',
        data: JSON.stringify({ items: store.getItems(listId) }),
      })

      const unsubscribe = subscribe(listId, (items) => {
        if (!closed) {
          stream
            .writeSSE({ event: 'items', data: JSON.stringify({ items }) })
            .catch(() => { closed = true })
        }
      })

      while (!closed) {
        await stream.sleep(30_000)
        if (!closed) {
          await stream.write(': ping\n\n').catch(() => { closed = true })
        }
      }

      unsubscribe()
    })
  })

  return app
}
