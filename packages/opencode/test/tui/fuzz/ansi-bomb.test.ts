import { describe, test, expect } from "bun:test"
import { stripAnsi, stripControlChars } from "@tui/util/robustness"

// ---------------------------------------------------------------------------
// Helpers – generate ANSI-heavy fuzz payloads
// ---------------------------------------------------------------------------

/** Random CSI parameter bytes (0x30–0x3F). */
function randomCsiParams(): string {
  const len = Math.floor(Math.random() * 8)
  let s = ""
  for (let i = 0; i < len; i++) s += String.fromCharCode(0x30 + Math.floor(Math.random() * 16))
  return s
}

/** Random CSI intermediate bytes (0x20–0x2F). */
function randomCsiIntermediates(): string {
  const len = Math.floor(Math.random() * 4)
  let s = ""
  for (let i = 0; i < len; i++) s += String.fromCharCode(0x20 + Math.floor(Math.random() * 16))
  return s
}

/** Generate a single random ANSI escape sequence. */
function randomAnsiSequence(): string {
  const kind = Math.floor(Math.random() * 5)
  switch (kind) {
    case 0: {
      // CSI: ESC [ <params> <final>
      const finalByte = String.fromCharCode(0x40 + Math.floor(Math.random() * 41))
      return `\x1b[${randomCsiParams()}${randomCsiIntermediates()}${finalByte}`
    }
    case 1: {
      // OSC with BEL terminator
      return `\x1b]${Math.floor(Math.random() * 10)};data-${Math.random().toString(36)}\x07`
    }
    case 2: {
      // OSC with ST terminator
      return `\x1b]${Math.floor(Math.random() * 10)};data-${Math.random().toString(36)}\x1b\\`
    }
    case 3: {
      // DCS
      return `\x1bP${Math.random().toString(36)}\x1b\\`
    }
    case 4: {
      // SOS / PM / APC
      const prefix = ["\x1bX", "\x1b^", "\x1b_"][Math.floor(Math.random() * 3)]
      return `${prefix}${Math.random().toString(36)}\x1b\\`
    }
    default:
      return ""
  }
}

/** Build a 100 KB+ string densely packed with ANSI escape sequences. */
function buildAnsiBomb(minBytes: number = 100_000): string {
  const chunks: string[] = []
  let total = 0
  while (total < minBytes) {
    const seq = randomAnsiSequence()
    chunks.push(seq)
    total += seq.length
    // Sprinkle some visible text (10% of the time) for realism
    if (Math.random() < 0.1) {
      const text = " ".repeat(Math.floor(Math.random() * 10) + 1)
      chunks.push(text)
      total += text.length
    }
  }
  return chunks.join("")
}

/**
 * Build a deterministic 100 KB+ string made of known ANSI sequences
 * interspersed with safe ASCII text (digits + punctuation only — no
 * letters that could accidentally form a CSI sequence).
 */
function buildDeterministicAnsiBomb(minBytes: number = 100_000): string {
  const sequences = [
    "\x1b[31m", "\x1b[0m", "\x1b[1;32m", "\x1b[2J", "\x1b[H",
    "\x1b[38;5;196m", "\x1b[38;2;255;0;0m", "\x1b]0;title\x07",
    "\x1b]0;title\x1b\\", "\x1bPdata\x1b\\", "\x1bXstr\x1b\\",
  ]
  const chunks: string[] = []
  let total = 0
  let i = 0
  while (total < minBytes) {
    chunks.push(sequences[i % sequences.length])
    total += sequences[i % sequences.length].length
    // Safe visible text: digits, spaces, punctuation — no A-Za-z
    const text = "0123456789 .,! "
    chunks.push(text)
    total += text.length
    i++
  }
  return chunks.join("")
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ANSI bomb fuzz", () => {
  // --- Random fuzz: crash-safety only ---

  test("stripAnsi does not throw on 100 KB random ANSI-heavy input", () => {
    const bomb = buildAnsiBomb(100_000)
    expect(() => stripAnsi(bomb)).not.toThrow()
  })

  test("stripControlChars does not throw on 100 KB random ANSI-heavy input", () => {
    const bomb = buildAnsiBomb(100_000)
    expect(() => stripControlChars(bomb)).not.toThrow()
  })

  test("combined pipeline: stripAnsi then stripControlChars on 100 KB random input", () => {
    const bomb = buildAnsiBomb(100_000)
    expect(() => {
      const step1 = stripAnsi(bomb)
      stripControlChars(step1)
    }).not.toThrow()
  })

  // --- Deterministic fuzz: correctness verification ---

  test("stripAnsi removes all ANSI sequences from deterministic 100 KB input", () => {
    const bomb = buildDeterministicAnsiBomb(100_000)
    const result = stripAnsi(bomb)
    // No ANSI escape bytes should remain in deterministic output
    // eslint-disable-next-line no-control-regex
    expect(/[\x1b\x9b]/.test(result)).toBe(false)
  })

  test("stripAnsi result from deterministic input contains only safe visible text", () => {
    const bomb = buildDeterministicAnsiBomb(100_000)
    const result = stripAnsi(bomb)
    // All remaining characters should be the safe text we interleaved
    const safe = /^[0-9 .,!\n\r\t]*$/
    expect(safe.test(result)).toBe(true)
  })

  // --- Performance ---

  test("stripAnsi performance: 100 KB input under 100 ms", () => {
    const bomb = buildAnsiBomb(100_000)
    const start = performance.now()
    stripAnsi(bomb)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })

  test("stripControlChars performance: 100 KB input under 100 ms", () => {
    const bomb = buildAnsiBomb(100_000)
    const start = performance.now()
    stripControlChars(bomb)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })

  // --- Output size reduction ---

  test("pure ANSI bomb (no visible text) produces near-empty result", () => {
    const chunks: string[] = []
    let total = 0
    while (total < 50_000) {
      const seq = randomAnsiSequence()
      chunks.push(seq)
      total += seq.length
    }
    const bomb = chunks.join("")
    const result = stripAnsi(bomb)
    // Result should be very short relative to input
    expect(result.length).toBeLessThan(bomb.length * 0.05)
  })

  // --- Idempotency ---

  test("repeated stripAnsi calls are idempotent", () => {
    const bomb = buildAnsiBomb(100_000)
    const pass1 = stripAnsi(bomb)
    const pass2 = stripAnsi(pass1)
    expect(pass2).toBe(pass1)
  })

  test("repeated stripControlChars calls are idempotent", () => {
    const bomb = buildAnsiBomb(100_000)
    const pass1 = stripControlChars(bomb)
    const pass2 = stripControlChars(pass1)
    expect(pass2).toBe(pass1)
  })

  // --- Edge cases ---

  test("handles deeply nested OSC sequences without hanging", () => {
    let payload = ""
    for (let i = 0; i < 1000; i++) {
      payload += `\x1b]0;${"a".repeat(50)}\x07`
    }
    expect(() => stripAnsi(payload)).not.toThrow()
  })

  test("stripControlChars result from deterministic input contains no C0/C1 control chars", () => {
    const bomb = buildDeterministicAnsiBomb(100_000)
    const result = stripControlChars(bomb)
    // eslint-disable-next-line no-control-regex
    const controlChars = result.replace(/[\n\r\t]/g, "").match(/[\x00-\x1f\x7f-\x9f]/g)
    expect(controlChars).toBeNull()
  })
})
