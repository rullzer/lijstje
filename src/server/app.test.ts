import { describe, it, expect, beforeEach } from 'vitest'
import { createDatabase } from './db/client.js'
import { createApp } from './app.js'

type App = ReturnType<typeof createApp>

// Helpers to reduce boilerplate in tests
async function createList(app: App, name = 'Shopping') {
  const res = await app.request('/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return res.json()
}

async function addItem(app: App, listId: string, text = 'Milk') {
  const res = await app.request(`/api/lists/${listId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return res.json()
}

describe('POST /api/lists', () => {
  let app: App

  beforeEach(() => {
    app = createApp(createDatabase(':memory:'))
  })

  it('creates a list and returns 201 with the list', async () => {
    const res = await app.request('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Shopping' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ name: 'Shopping' })
    expect(typeof body.id).toBe('string')
    expect(typeof body.createdAt).toBe('string')
  })

  it('returns 400 for empty name', async () => {
    const res = await app.request('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.any(String) })
  })

  it('returns 400 for missing name', async () => {
    const res = await app.request('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/lists/:id', () => {
  let app: App

  beforeEach(() => {
    app = createApp(createDatabase(':memory:'))
  })

  it('returns the list with an empty items array', async () => {
    const { id } = await createList(app)
    const res = await app.request(`/api/lists/${id}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id, name: 'Shopping', items: [] })
  })

  it('returns the list with its items', async () => {
    const { id } = await createList(app)
    await addItem(app, id, 'Milk')
    await addItem(app, id, 'Eggs')
    const res = await app.request(`/api/lists/${id}`)
    const body = await res.json()
    expect(body.items).toHaveLength(2)
    expect(body.items[0].text).toBe('Milk')
    expect(body.items[1].text).toBe('Eggs')
  })

  it('returns 404 for unknown id', async () => {
    const res = await app.request('/api/lists/nope')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/lists/:id/items', () => {
  let app: App

  beforeEach(() => {
    app = createApp(createDatabase(':memory:'))
  })

  it('adds an item and returns 201', async () => {
    const { id } = await createList(app)
    const res = await app.request(`/api/lists/${id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Milk' }),
    })
    expect(res.status).toBe(201)
    const item = await res.json()
    expect(item).toMatchObject({ text: 'Milk', checked: false, listId: id })
    expect(typeof item.id).toBe('string')
  })

  it('returns 404 for unknown list', async () => {
    const res = await app.request('/api/lists/nope/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Milk' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 400 for empty text', async () => {
    const { id } = await createList(app)
    const res = await app.request(`/api/lists/${id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/lists/:id/items/:itemId', () => {
  let app: App

  beforeEach(() => {
    app = createApp(createDatabase(':memory:'))
  })

  it('toggles checked to true', async () => {
    const { id } = await createList(app)
    const item = await addItem(app, id)
    const res = await app.request(`/api/lists/${id}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: true }),
    })
    expect(res.status).toBe(200)
    expect((await res.json()).checked).toBe(true)
  })

  it('updates text', async () => {
    const { id } = await createList(app)
    const item = await addItem(app, id)
    const res = await app.request(`/api/lists/${id}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Oat Milk' }),
    })
    expect(res.status).toBe(200)
    expect((await res.json()).text).toBe('Oat Milk')
  })

  it('returns 400 for empty patch body', async () => {
    const { id } = await createList(app)
    const item = await addItem(app, id)
    const res = await app.request(`/api/lists/${id}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown list', async () => {
    const res = await app.request('/api/lists/nope/items/item-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: true }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 404 for unknown item', async () => {
    const { id } = await createList(app)
    const res = await app.request(`/api/lists/${id}/items/nope`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: true }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/lists/:id/items/:itemId', () => {
  let app: App

  beforeEach(() => {
    app = createApp(createDatabase(':memory:'))
  })

  it('deletes an item and returns 204', async () => {
    const { id } = await createList(app)
    const item = await addItem(app, id)
    const res = await app.request(`/api/lists/${id}/items/${item.id}`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  it('item is gone after deletion', async () => {
    const { id } = await createList(app)
    const item = await addItem(app, id)
    await app.request(`/api/lists/${id}/items/${item.id}`, { method: 'DELETE' })
    const res = await app.request(`/api/lists/${id}`)
    const body = await res.json()
    expect(body.items).toHaveLength(0)
  })

  it('returns 404 for unknown list', async () => {
    const res = await app.request('/api/lists/nope/items/item-1', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })

  it('returns 404 for unknown item', async () => {
    const { id } = await createList(app)
    const res = await app.request(`/api/lists/${id}/items/nope`, { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})
