/**
 * Standalone diagnostics module — no SolidJS Provider needed.
 * Exports performance instrumentation and memory utilities used by /diag command
 * and crash dump logic.
 */

const MAX_PERF_ENTRIES = 200

export interface PerfEntry {
  label: string
  duration: number
  timestamp: number
}

// ---------------------------------------------------------------------------
// Perf log (plain array — no reactive overhead)
// ---------------------------------------------------------------------------
const entries: PerfEntry[] = []

function pushEntry(entry: PerfEntry) {
  if (entries.length >= MAX_PERF_ENTRIES) {
    entries.shift()
  }
  entries.push(entry)
}

/** Measure a synchronous function and record the duration. */
export function diagMark<T>(label: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  pushEntry({ label, duration, timestamp: Date.now() })
  return result
}

/** Measure an async function and record the duration. */
export async function diagMarkAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  pushEntry({ label, duration, timestamp: Date.now() })
  return result
}

/** Return a shallow copy of the perf log (most recent last). */
export function diagPerfLog(): PerfEntry[] {
  return [...entries]
}

// ---------------------------------------------------------------------------
// Memory helpers
// ---------------------------------------------------------------------------
export interface MemoryInfo {
  heapUsed: string
  heapTotal: string
  rss: string
  external: string
  arrayBuffers: string
}

export function diagMemory(): MemoryInfo {
  const mem = process.memoryUsage()
  return {
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`,
    arrayBuffers: `${Math.round(mem.arrayBuffers / 1024 / 1024)}MB`,
  }
}

/** Raw memoryUsage for crash dumps. */
export function diagMemoryRaw(): NodeJS.MemoryUsage {
  return process.memoryUsage()
}

// ---------------------------------------------------------------------------
// Crash dump
// ---------------------------------------------------------------------------
import { writeFileSync, mkdirSync, existsSync } from "fs"
import { homedir } from "os"
import { join } from "path"

export interface CrashDump {
  timestamp: string
  error: {
    message: string
    stack?: string
    name?: string
  }
  memory: NodeJS.MemoryUsage
  uptime: number
  perfLog: PerfEntry[]
}

function crashDir(): string {
  return join(homedir(), ".opencode")
}

export function writeCrashDump(error: unknown): string | null {
  try {
    const dir = crashDir()
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filePath = join(dir, `crash-dump-${timestamp}.json`)

    const dump: CrashDump = {
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      },
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      perfLog: diagPerfLog(),
    }

    writeFileSync(filePath, JSON.stringify(dump, null, 2), "utf-8")
    return filePath
  } catch {
    return null
  }
}
