import type { List, Item } from '../protocol.js'

// Extends Item with a client-only flag for optimistic UI
export type ClientItem = Item & { _temp?: boolean }

export type ListState = {
  list: List
  items: ClientItem[]
  offline: boolean
  editingId: string | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderItem(item: ClientItem, disabled: boolean): string {
  const checkedAttr = item.checked ? 'checked' : ''
  const disabledAttr = disabled ? 'disabled' : ''
  const textClass = item.checked ? 'line-through text-gray-400' : 'text-gray-900'
  const tempClass = item._temp ? 'opacity-50' : ''

  return `
    <li data-id="${escapeHtml(item.id)}" class="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 ${tempClass}">
      <input
        type="checkbox"
        class="w-5 h-5 rounded accent-emerald-500 cursor-pointer flex-shrink-0"
        ${checkedAttr} ${disabledAttr}
        data-action="toggle"
      />
      <span class="flex-1 text-base ${textClass} cursor-pointer" data-action="edit-text"
      >${escapeHtml(item.text)}</span>
      <button
        class="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
        ${disabledAttr} data-action="delete" aria-label="Delete item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </li>`
}

function renderEditRow(item: ClientItem): string {
  return `
    <li data-id="${escapeHtml(item.id)}" class="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <input type="checkbox" class="w-5 h-5 rounded accent-emerald-500 flex-shrink-0" ${item.checked ? 'checked' : ''} disabled />
      <input
        id="edit-input" type="text" value="${escapeHtml(item.text)}"
        class="flex-1 text-base border-b border-emerald-400 outline-none bg-transparent"
        data-action="save-edit"
      />
      <button class="text-gray-400 hover:text-gray-600 text-sm px-2" data-action="cancel-edit">cancel</button>
    </li>`
}

function renderProgress(items: ClientItem[]): string {
  const total = items.filter((i) => !i._temp).length
  const done = items.filter((i) => i.checked && !i._temp).length
  if (total === 0) return ''
  return `<span class="text-sm text-gray-400">${done} of ${total} done</span>`
}

function renderOfflineBanner(show: boolean): string {
  if (!show) return ''
  return `
    <div class="bg-amber-100 border-b border-amber-200 text-amber-800 text-sm text-center py-2 px-4">
      Reconnecting… changes are paused
    </div>`
}

export function renderListPage(state: ListState): string {
  const { list, items, offline, editingId } = state

  const itemRows = items
    .map((item) => (item.id === editingId ? renderEditRow(item) : renderItem(item, offline)))
    .join('')

  return `
    <div id="app" class="min-h-screen bg-gray-50">
      ${renderOfflineBanner(offline)}
      <div class="max-w-lg mx-auto px-4 pt-8 pb-24">
        <div class="flex items-center justify-between mb-1">
          <h1 class="text-2xl font-semibold text-gray-900">${escapeHtml(list.name)}</h1>
          <button id="share-btn" class="text-sm text-emerald-600 hover:text-emerald-700 font-medium" data-action="share">Share</button>
        </div>
        <div class="mb-6">${renderProgress(items)}</div>
        <ul class="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          ${itemRows || `<li class="py-6 text-center text-gray-400 text-sm">No items yet</li>`}
        </ul>
        <form id="add-form" class="flex gap-2">
          <input
            id="add-input" type="text" placeholder="Add an item…"
            class="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-base outline-none focus:border-emerald-400 bg-white shadow-sm"
            ${offline ? 'disabled' : ''} autocomplete="off"
          />
          <button
            type="submit"
            class="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-5 py-3 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            ${offline ? 'disabled' : ''}
          >Add</button>
        </form>
      </div>
    </div>`
}
