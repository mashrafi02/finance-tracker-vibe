import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// In production, use a connection pool. In development, reuse the connection.
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 10 : 1,
})

export const db = drizzle(client, { schema })
