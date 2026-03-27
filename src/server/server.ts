import { serve } from '@hono/node-server'
import { createDatabase } from './db/client.js'
import { createApp } from './app.js'

const db = createDatabase('./data.db')
const app = createApp(db)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Lijstje running at http://localhost:${info.port}`)
})
