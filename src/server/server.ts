import { serve } from '@hono/node-server'
import { createStore } from './store/store.js'
import { loadAll, createPersister } from './store/persist.js'
import { createApp } from './app.js'

const dataDir = process.env.DATA_DIR ?? '.'

const initial = await loadAll(dataDir)
const store = createStore(initial)
const persist = createPersister(dataDir, store)
const app = createApp(store, persist)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Lijstje running at http://localhost:${info.port}`)
})
