import morphdom from 'morphdom'
import type { Item, List } from '../protocol.js'
import { getList, addItem, updateItem, deleteItem } from './api.js'
import { renderListPage, type ClientItem } from './render.js'
import { connectSSE } from './sse.js'

const listId = window.location.pathname.split('/').pop()!

// --- State ---

type State = {
  list: List | null
  items: ClientItem[]
  offline: boolean
  editingId: string | null
}

let state: State = { list: null, items: [], offline: false, editingId: null }

// --- Render ---

function render() {
  const { list } = state
  if (!list) return
  const tmp = document.createElement('div')
  tmp.innerHTML = renderListPage({ ...state, list })
  morphdom(document.getElementById('app')!, tmp.firstElementChild!, {
    onBeforeElUpdated(from, to) {
      // Preserve focus on the active element to avoid interrupting typing
      return from !== document.activeElement
    },
  })
}

// --- Diff helpers ---

// Keep any still-pending optimistic items that haven't been confirmed server-side yet
function mergeWithOptimistic(serverItems: Item[]): ClientItem[] {
  const confirmedTexts = new Set(serverItems.map((i) => i.text))
  const stillPending = state.items.filter((i) => i._temp && !confirmedTexts.has(i.text))
  return [...serverItems, ...stillPending]
}

// --- Actions ---

async function handleAdd(text: string) {
  const tempId = `temp-${Date.now()}`
  const tempItem: ClientItem = {
    id: tempId, listId, text, checked: false,
    createdAt: '', updatedAt: '', _temp: true,
  }
  state = { ...state, items: [...state.items, tempItem] }
  render()
  try {
    await addItem(listId, text)
  } catch (err) {
    state = { ...state, items: state.items.filter((i) => i.id !== tempId) }
    render()
    console.error('Failed to add item:', err)
  }
}

async function handleToggle(itemId: string) {
  const item = state.items.find((i) => i.id === itemId)
  if (!item) return
  state = { ...state, items: state.items.map((i) => i.id === itemId ? { ...i, checked: !i.checked } : i) }
  render()
  try {
    await updateItem(listId, itemId, { checked: !item.checked })
  } catch (err) {
    state = { ...state, items: state.items.map((i) => i.id === itemId ? { ...i, checked: item.checked } : i) }
    render()
    console.error('Failed to toggle item:', err)
  }
}

async function handleSaveEdit(itemId: string, text: string) {
  const item = state.items.find((i) => i.id === itemId)
  if (!item || text.trim() === item.text) {
    state = { ...state, editingId: null }
    render()
    return
  }
  const trimmed = text.trim()
  state = { ...state, editingId: null, items: state.items.map((i) => i.id === itemId ? { ...i, text: trimmed } : i) }
  render()
  try {
    await updateItem(listId, itemId, { text: trimmed })
  } catch (err) {
    state = { ...state, items: state.items.map((i) => i.id === itemId ? { ...i, text: item.text } : i) }
    render()
    console.error('Failed to edit item:', err)
  }
}

async function handleDelete(itemId: string) {
  const prev = state.items
  state = { ...state, items: state.items.filter((i) => i.id !== itemId) }
  render()
  try {
    await deleteItem(listId, itemId)
  } catch (err) {
    state = { ...state, items: prev }
    render()
    console.error('Failed to delete item:', err)
  }
}

// --- Event delegation ---

document.addEventListener('submit', (e) => {
  if ((e.target as HTMLElement).id !== 'add-form') return
  e.preventDefault()
  if (state.offline) return
  const input = document.getElementById('add-input') as HTMLInputElement
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  handleAdd(text)
})

document.addEventListener('change', (e) => {
  const target = e.target as HTMLElement
  if (target.dataset.action !== 'toggle') return
  if (state.offline) { (target as HTMLInputElement).checked = !(target as HTMLInputElement).checked; return }
  const li = target.closest<HTMLElement>('li[data-id]')
  if (li?.dataset.id) handleToggle(li.dataset.id)
})

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
  if (!el) return
  const li = el.closest<HTMLElement>('li[data-id]')

  switch (el.dataset.action) {
    case 'delete':
      if (!state.offline && li?.dataset.id) handleDelete(li.dataset.id)
      break
    case 'edit-text':
      if (!state.offline && li?.dataset.id) {
        state = { ...state, editingId: li.dataset.id }
        render()
        requestAnimationFrame(() => {
          const input = document.getElementById('edit-input') as HTMLInputElement | null
          input?.focus(); input?.select()
        })
      }
      break
    case 'cancel-edit':
      state = { ...state, editingId: null }
      render()
      break
    case 'share':
      navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = document.getElementById('share-btn')!
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = 'Share' }, 2000)
      })
      break
  }
})

document.addEventListener('keydown', (e: KeyboardEvent) => {
  const input = document.getElementById('edit-input') as HTMLInputElement | null
  if (e.key === 'Enter' && input && document.activeElement === input) {
    const li = input.closest<HTMLElement>('li[data-id]')
    if (li?.dataset.id) handleSaveEdit(li.dataset.id, input.value)
  }
  if (e.key === 'Escape' && state.editingId) {
    state = { ...state, editingId: null }
    render()
  }
})

document.addEventListener('focusout', (e) => {
  const target = e.target as HTMLElement
  if (target.dataset.action !== 'save-edit') return
  const li = target.closest<HTMLElement>('li[data-id]')
  if (li?.dataset.id) handleSaveEdit(li.dataset.id, (target as HTMLInputElement).value)
})

// --- Init ---

async function init() {
  const { items, ...list } = await getList(listId)
  state = { ...state, list, items }
  render()

  connectSSE(listId, {
    onItems(serverItems) {
      state = { ...state, items: mergeWithOptimistic(serverItems) }
      render()
    },
    onStatusChange(online) {
      state = { ...state, offline: !online }
      render()
    },
  })
}

init().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : 'Unknown error'
  document.getElementById('app')!.innerHTML =
    `<div style="padding:2rem;color:red">Error loading list: ${msg}</div>`
})
