type Ok<T> = { ok: true; value: T }
type Err = { ok: false; error: string }
type Result<T> = Ok<T> | Err

const err = (error: string): Err => ({ ok: false, error })
const ok = <T>(value: T): Ok<T> => ({ ok: true, value })

export function validateName(name: unknown): Result<string> {
  if (typeof name !== 'string') return err('name must be a string')
  const trimmed = name.trim()
  if (trimmed.length === 0) return err('name cannot be empty')
  if (trimmed.length > 100) return err('name cannot exceed 100 characters')
  return ok(trimmed)
}

export function validateText(text: unknown): Result<string> {
  if (typeof text !== 'string') return err('text must be a string')
  const trimmed = text.trim()
  if (trimmed.length === 0) return err('text cannot be empty')
  if (trimmed.length > 200) return err('text cannot exceed 200 characters')
  return ok(trimmed)
}

export function validatePatch(body: unknown): Result<{ text?: string; checked?: boolean }> {
  if (typeof body !== 'object' || body === null) return err('body must be an object')

  const b = body as Record<string, unknown>
  const patch: { text?: string; checked?: boolean } = {}

  if ('text' in b) {
    const result = validateText(b.text)
    if (!result.ok) return result
    patch.text = result.value
  }

  if ('checked' in b) {
    if (typeof b.checked !== 'boolean') return err('checked must be a boolean')
    patch.checked = b.checked
  }

  if (Object.keys(patch).length === 0) {
    return err('at least one of text or checked must be provided')
  }

  return ok(patch)
}
