import { describe, it, expect, beforeEach } from 'vitest'
import { createDatabase, type Db } from './client.js'
import { createList, getList, listExists } from './lists.js'

describe('lists db', () => {
  let db: Db

  beforeEach(() => {
    db = createDatabase(':memory:')
  })

  it('creates a list and returns it', () => {
    const list = createList(db, { id: 'abc', name: 'Shopping', createdAt: '2024-01-01T00:00:00.000Z' })
    expect(list).toEqual({ id: 'abc', name: 'Shopping', createdAt: '2024-01-01T00:00:00.000Z' })
  })

  it('gets a list by id', () => {
    createList(db, { id: 'abc', name: 'Shopping', createdAt: '2024-01-01T00:00:00.000Z' })
    expect(getList(db, 'abc')).toEqual({ id: 'abc', name: 'Shopping', createdAt: '2024-01-01T00:00:00.000Z' })
  })

  it('returns null for unknown id', () => {
    expect(getList(db, 'nope')).toBeNull()
  })

  it('listExists returns true when list exists', () => {
    createList(db, { id: 'abc', name: 'Shopping', createdAt: '2024-01-01T00:00:00.000Z' })
    expect(listExists(db, 'abc')).toBe(true)
  })

  it('listExists returns false when list does not exist', () => {
    expect(listExists(db, 'nope')).toBe(false)
  })
})
