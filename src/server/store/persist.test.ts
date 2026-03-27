import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { atomicWrite, loadAll } from './persist.js'

const LIST = { id: 'list-1', name: 'Shopping', createdAt: '2024-01-01T00:00:00.000Z' }

let dir: string

beforeEach(() => {
  dir = join(tmpdir(), `lijstje-test-${randomUUID()}`)
  mkdirSync(dir, { recursive: true })
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('atomicWrite', () => {
  it('writes data as JSON', async () => {
    const file = join(dir, 'test.json')
    await atomicWrite(file, { hello: 'world' })
    const content = JSON.parse(await readFile(file, 'utf-8'))
    expect(content).toEqual({ hello: 'world' })
  })

  it('overwrites an existing file', async () => {
    const file = join(dir, 'test.json')
    await atomicWrite(file, { v: 1 })
    await atomicWrite(file, { v: 2 })
    const content = JSON.parse(await readFile(file, 'utf-8'))
    expect(content).toEqual({ v: 2 })
  })

  it('leaves no tmp file behind', async () => {
    const file = join(dir, 'test.json')
    await atomicWrite(file, { ok: true })
    const { readdirSync } = await import('node:fs')
    const files = readdirSync(dir)
    expect(files).toEqual(['test.json'])
  })
})

describe('loadAll', () => {
  it('returns an empty map for an empty directory', async () => {
    expect((await loadAll(dir)).size).toBe(0)
  })

  it('loads a JSON file written by atomicWrite', async () => {
    const entry = { list: LIST, items: [] }
    await atomicWrite(join(dir, 'list-1.json'), entry)
    const result = await loadAll(dir)
    expect(result.size).toBe(1)
    expect(result.get('list-1')).toEqual(entry)
  })

  it('loads multiple files', async () => {
    await atomicWrite(join(dir, 'list-1.json'), { list: { ...LIST, id: 'list-1' }, items: [] })
    await atomicWrite(join(dir, 'list-2.json'), { list: { ...LIST, id: 'list-2' }, items: [] })
    expect((await loadAll(dir)).size).toBe(2)
  })

  it('ignores non-JSON files', async () => {
    writeFileSync(join(dir, 'README.txt'), 'hello')
    writeFileSync(join(dir, '.DS_Store'), '')
    expect((await loadAll(dir)).size).toBe(0)
  })

  it('skips malformed JSON files without throwing', async () => {
    writeFileSync(join(dir, 'broken.json'), 'not json {{{')
    expect((await loadAll(dir)).size).toBe(0)
  })

  it('returns empty map when data dir does not exist', async () => {
    expect((await loadAll(join(dir, 'nonexistent'))).size).toBe(0)
  })
})
