import { describe, it, expect, beforeEach } from 'vitest'
import { createDatabase, type Db } from './client.js'
import { createList } from './lists.js'
import { createItem, getItems, getItem, updateItem, deleteItem } from './items.js'

const LIST = { id: 'list-1', name: 'Shopping', createdAt: '2024-01-01T00:00:00.000Z' }
const T0 = '2024-01-01T00:00:00.000Z'
const T1 = '2024-01-01T01:00:00.000Z'
const T2 = '2024-01-01T02:00:00.000Z'

describe('items db', () => {
  let db: Db

  beforeEach(() => {
    db = createDatabase(':memory:')
    createList(db, LIST)
  })

  it('creates an item with checked=false', () => {
    const item = createItem(db, { id: 'i1', listId: 'list-1', text: 'Milk', createdAt: T0, updatedAt: T0 })
    expect(item).toEqual({ id: 'i1', listId: 'list-1', text: 'Milk', checked: false, createdAt: T0, updatedAt: T0 })
  })

  it('gets all items for a list ordered by createdAt', () => {
    createItem(db, { id: 'i1', listId: 'list-1', text: 'Milk', createdAt: T0, updatedAt: T0 })
    createItem(db, { id: 'i2', listId: 'list-1', text: 'Eggs', createdAt: T1, updatedAt: T1 })
    const items = getItems(db, 'list-1')
    expect(items).toHaveLength(2)
    expect(items[0].text).toBe('Milk')
    expect(items[1].text).toBe('Eggs')
  })

  it('returns empty array for list with no items', () => {
    expect(getItems(db, 'list-1')).toEqual([])
  })

  it('getItem returns null for unknown id', () => {
    expect(getItem(db, 'nope')).toBeNull()
  })

  it('updates item text', () => {
    createItem(db, { id: 'i1', listId: 'list-1', text: 'Milk', createdAt: T0, updatedAt: T0 })
    const updated = updateItem(db, 'i1', { text: 'Oat Milk', updatedAt: T1 })
    expect(updated?.text).toBe('Oat Milk')
    expect(updated?.updatedAt).toBe(T1)
    expect(updated?.checked).toBe(false)
  })

  it('updates item checked', () => {
    createItem(db, { id: 'i1', listId: 'list-1', text: 'Milk', createdAt: T0, updatedAt: T0 })
    const updated = updateItem(db, 'i1', { checked: true, updatedAt: T1 })
    expect(updated?.checked).toBe(true)
    expect(updated?.text).toBe('Milk')
  })

  it('updates both text and checked', () => {
    createItem(db, { id: 'i1', listId: 'list-1', text: 'Milk', createdAt: T0, updatedAt: T0 })
    const updated = updateItem(db, 'i1', { text: 'Oat Milk', checked: true, updatedAt: T2 })
    expect(updated?.text).toBe('Oat Milk')
    expect(updated?.checked).toBe(true)
    expect(updated?.updatedAt).toBe(T2)
  })

  it('returns null when updating unknown item', () => {
    expect(updateItem(db, 'nope', { checked: true, updatedAt: T1 })).toBeNull()
  })

  it('deletes an item and returns true', () => {
    createItem(db, { id: 'i1', listId: 'list-1', text: 'Milk', createdAt: T0, updatedAt: T0 })
    expect(deleteItem(db, 'i1')).toBe(true)
    expect(getItem(db, 'i1')).toBeNull()
  })

  it('returns false when deleting unknown item', () => {
    expect(deleteItem(db, 'nope')).toBe(false)
  })
})
