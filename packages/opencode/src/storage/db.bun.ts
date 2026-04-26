import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

export function init(path: string) {
  try {
    const sqlite = new Database(path, { create: true })
    const db = drizzle({ client: sqlite })
    return db
  } catch (err) {
    console.warn(`[db.bun] failed to open database at ${path}, falling back to :memory:`, err)
    const sqlite = new Database(":memory:")
    const db = drizzle({ client: sqlite })
    return db
  }
}
