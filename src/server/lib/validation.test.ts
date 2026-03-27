import { describe, it, expect } from 'vitest'
import { validateName, validateText, validatePatch } from './validation.js'

describe('validateName', () => {
  it('accepts a valid name', () => {
    expect(validateName('Shopping')).toEqual({ ok: true, value: 'Shopping' })
  })

  it('trims surrounding whitespace', () => {
    expect(validateName('  Shopping  ')).toEqual({ ok: true, value: 'Shopping' })
  })

  it('rejects empty string', () => {
    expect(validateName('')).toMatchObject({ ok: false })
  })

  it('rejects whitespace-only string', () => {
    expect(validateName('   ')).toMatchObject({ ok: false })
  })

  it('rejects non-string', () => {
    expect(validateName(42)).toMatchObject({ ok: false })
    expect(validateName(null)).toMatchObject({ ok: false })
    expect(validateName(undefined)).toMatchObject({ ok: false })
  })

  it('rejects string over 100 chars', () => {
    expect(validateName('a'.repeat(101))).toMatchObject({ ok: false })
  })

  it('accepts exactly 100 chars', () => {
    expect(validateName('a'.repeat(100))).toMatchObject({ ok: true })
  })
})

describe('validateText', () => {
  it('accepts valid text', () => {
    expect(validateText('Milk')).toEqual({ ok: true, value: 'Milk' })
  })

  it('trims surrounding whitespace', () => {
    expect(validateText('  Milk  ')).toEqual({ ok: true, value: 'Milk' })
  })

  it('rejects empty string', () => {
    expect(validateText('')).toMatchObject({ ok: false })
  })

  it('rejects non-string', () => {
    expect(validateText(42)).toMatchObject({ ok: false })
  })

  it('rejects string over 200 chars', () => {
    expect(validateText('a'.repeat(201))).toMatchObject({ ok: false })
  })

  it('accepts exactly 200 chars', () => {
    expect(validateText('a'.repeat(200))).toMatchObject({ ok: true })
  })
})

describe('validatePatch', () => {
  it('accepts text only', () => {
    expect(validatePatch({ text: 'Milk' })).toEqual({ ok: true, value: { text: 'Milk' } })
  })

  it('accepts checked only', () => {
    expect(validatePatch({ checked: true })).toEqual({ ok: true, value: { checked: true } })
  })

  it('accepts both text and checked', () => {
    expect(validatePatch({ text: 'Milk', checked: false })).toEqual({
      ok: true,
      value: { text: 'Milk', checked: false },
    })
  })

  it('trims text', () => {
    expect(validatePatch({ text: '  Milk  ' })).toEqual({ ok: true, value: { text: 'Milk' } })
  })

  it('rejects empty object', () => {
    expect(validatePatch({})).toMatchObject({ ok: false })
  })

  it('rejects non-boolean checked', () => {
    expect(validatePatch({ checked: 'true' })).toMatchObject({ ok: false })
    expect(validatePatch({ checked: 1 })).toMatchObject({ ok: false })
  })

  it('rejects null', () => {
    expect(validatePatch(null)).toMatchObject({ ok: false })
  })

  it('rejects non-object', () => {
    expect(validatePatch('string')).toMatchObject({ ok: false })
  })
})
