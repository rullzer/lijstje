import { describe, it, expect } from 'vitest'
import { createStore } from './store.js'

const LIST = { id: 'list-1', name: 'Shopping', createdAt: '2024-01-01T00:00:00.000Z' }
const T0 = '2024-01-01T00:00:00.000Z'
const T1 = '2024-01-01T01:00:00.000Z'
const T2 = '2024-01-01T02:00:00.000Z'

const item = (id: string, text: string) => ({
  id, listId: 'list-1', text, checked: false, createdAt: T0, updatedAt: T0,
})

describe('store — lists', () => {
  it('creates and returns a list', () => {
    const store = createStore()
    expect(store.createList(LIST)).toEqual(LIST)
  })

  it('gets a list by id', () => {
    const store = createStore()
    store.createList(LIST)
    expect(store.getList('list-1')).toEqual(LIST)
  })

  it('returns null for unknown list', () => {
    expect(createStore().getList('nope')).toBeNull()
  })

  it('listExists returns true when list exists', () => {
    const store = createStore()
    store.createList(LIST)
    expect(store.listExists('list-1')).toBe(true)
  })

  it('listExists returns false when list does not exist', () => {
    expect(createStore().listExists('nope')).toBe(false)
  })
})

describe('store — items', () => {
  it('creates and returns an item', () => {
    const store = createStore()
    store.createList(LIST)
    const i = item('i1', 'Milk')
    expect(store.createItem(i)).toEqual(i)
  })

  it('getItems returns items in insertion order', () => {
    const store = createStore()
    store.createList(LIST)
    store.createItem(item('i1', 'Milk'))
    store.createItem(item('i2', 'Eggs'))
    expect(store.getItems('list-1').map((i) => i.text)).toEqual(['Milk', 'Eggs'])
  })

  it('getItems returns empty array when list has no items', () => {
    const store = createStore()
    store.createList(LIST)
    expect(store.getItems('list-1')).toEqual([])
  })

  it('updates item text', () => {
    const store = createStore()
    store.createList(LIST)
    store.createItem(item('i1', 'Milk'))
    const updated = store.updateItem('list-1', 'i1', { text: 'Oat Milk', updatedAt: T1 })
    expect(updated?.text).toBe('Oat Milk')
    expect(updated?.updatedAt).toBe(T1)
    expect(updated?.checked).toBe(false)
  })

  it('updates item checked', () => {
    const store = createStore()
    store.createList(LIST)
    store.createItem(item('i1', 'Milk'))
    const updated = store.updateItem('list-1', 'i1', { checked: true, updatedAt: T1 })
    expect(updated?.checked).toBe(true)
    expect(updated?.text).toBe('Milk')
  })

  it('updates both text and checked', () => {
    const store = createStore()
    store.createList(LIST)
    store.createItem(item('i1', 'Milk'))
    const updated = store.updateItem('list-1', 'i1', { text: 'Oat Milk', checked: true, updatedAt: T2 })
    expect(updated?.text).toBe('Oat Milk')
    expect(updated?.checked).toBe(true)
    expect(updated?.updatedAt).toBe(T2)
  })

  it('returns null when updating item in unknown list', () => {
    expect(createStore().updateItem('nope', 'i1', { checked: true, updatedAt: T1 })).toBeNull()
  })

  it('returns null when updating unknown item', () => {
    const store = createStore()
    store.createList(LIST)
    expect(store.updateItem('list-1', 'nope', { checked: true, updatedAt: T1 })).toBeNull()
  })

  it('deletes an item and returns true', () => {
    const store = createStore()
    store.createList(LIST)
    store.createItem(item('i1', 'Milk'))
    expect(store.deleteItem('list-1', 'i1')).toBe(true)
    expect(store.getItems('list-1')).toEqual([])
  })

  it('returns false when deleting unknown item', () => {
    const store = createStore()
    store.createList(LIST)
    expect(store.deleteItem('list-1', 'nope')).toBe(false)
  })
})

describe('store — isolation', () => {
  it('two stores do not share state', () => {
    const s1 = createStore()
    const s2 = createStore()
    s1.createList(LIST)
    expect(s2.getList('list-1')).toBeNull()
  })

  it('can be initialised with existing data', () => {
    const initial = new Map([['list-1', { list: LIST, items: [item('i1', 'Milk')] }]])
    const store = createStore(initial)
    expect(store.getList('list-1')).toEqual(LIST)
    expect(store.getItems('list-1')).toHaveLength(1)
  })
})
