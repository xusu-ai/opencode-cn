import { DatabaseSync } from "node:sqlite"
import { drizzle } from "drizzle-orm/node-sqlite"

export function init(path: string) {
  try {
    const sqlite = new DatabaseSync(path)
    const db = drizzle({ client: sqlite })
    return db
  } catch (err) {
    console.warn(`[db.node] failed to open database at ${path}, falling back to :memory:`, err)
    const sqlite = new DatabaseSync(":memory:")
    const db = drizzle({ client: sqlite })
    return db
  }
}
