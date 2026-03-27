export type List = {
  id: string
  name: string
  createdAt: string // ISO 8601
}

export type Item = {
  id: string
  listId: string
  text: string
  checked: boolean
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

export type ListWithItems = List & { items: Item[] }

export type ApiError = { error: string }

// SSE: event name "items", payload { items: Item[] }
export type ItemsEvent = { items: Item[] }
