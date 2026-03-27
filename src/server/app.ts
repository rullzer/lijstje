import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Db } from './db/client.js'
import { createList, getList } from './db/lists.js'
import { createItem, getItems, updateItem, deleteItem } from './db/items.js'
import { validateName, validateText, validatePatch } from './lib/validation.js'
import { subscribe, broadcast } from './lib/broadcaster.js'

export function createApp(db: Db) {
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
    const body = await c.req.json()
    const result = validateName(body?.name)
    if (!result.ok) return c.json({ error: result.error }, 400)

    const list = createList(db, {
      id: crypto.randomUUID(),
      name: result.value,
      createdAt: new Date().toISOString(),
    })
    return c.json(list, 201)
  })

  app.get('/api/lists/:id', (c) => {
    const list = getList(db, c.req.param('id'))
    if (!list) return c.json({ error: 'list not found' }, 404)
    return c.json({ ...list, items: getItems(db, list.id) })
  })

  app.post('/api/lists/:id/items', async (c) => {
    const listId = c.req.param('id')
    if (!getList(db, listId)) return c.json({ error: 'list not found' }, 404)

    const body = await c.req.json()
    const result = validateText(body?.text)
    if (!result.ok) return c.json({ error: result.error }, 400)

    const now = new Date().toISOString()
    const item = createItem(db, {
      id: crypto.randomUUID(),
      listId,
      text: result.value,
      createdAt: now,
      updatedAt: now,
    })

    broadcast(listId, getItems(db, listId))
    return c.json(item, 201)
  })

  app.patch('/api/lists/:id/items/:itemId', async (c) => {
    const listId = c.req.param('id')
    if (!getList(db, listId)) return c.json({ error: 'list not found' }, 404)

    const body = await c.req.json()
    const result = validatePatch(body)
    if (!result.ok) return c.json({ error: result.error }, 400)

    const item = updateItem(db, c.req.param('itemId'), {
      ...result.value,
      updatedAt: new Date().toISOString(),
    })
    if (!item) return c.json({ error: 'item not found' }, 404)

    broadcast(listId, getItems(db, listId))
    return c.json(item)
  })

  app.delete('/api/lists/:id/items/:itemId', (c) => {
    const listId = c.req.param('id')
    if (!getList(db, listId)) return c.json({ error: 'list not found' }, 404)

    const deleted = deleteItem(db, c.req.param('itemId'))
    if (!deleted) return c.json({ error: 'item not found' }, 404)

    broadcast(listId, getItems(db, listId))
    return new Response(null, { status: 204 })
  })

  // --- SSE stream ---

  app.get('/api/lists/:id/stream', (c) => {
    const listId = c.req.param('id')
    if (!getList(db, listId)) return c.json({ error: 'list not found' }, 404)

    return streamSSE(c, async (stream) => {
      let closed = false
      stream.onAbort(() => { closed = true })

      // Send current state immediately on connect
      await stream.writeSSE({
        event: 'items',
        data: JSON.stringify({ items: getItems(db, listId) }),
      })

      const unsubscribe = subscribe(listId, (items) => {
        if (!closed) {
          stream
            .writeSSE({ event: 'items', data: JSON.stringify({ items }) })
            .catch(() => { closed = true })
        }
      })

      // Keepalive ping every 30s to prevent proxy timeouts
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
