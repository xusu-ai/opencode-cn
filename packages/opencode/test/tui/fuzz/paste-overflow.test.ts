import { describe, test, expect } from "bun:test"
import { enforcePasteLimit, isPasteOverLimit, MAX_PASTE_SIZE } from "@tui/util/robustness"

// ---------------------------------------------------------------------------
// Helpers – generate oversized fuzz payloads
// ---------------------------------------------------------------------------

/** Build a 1 MB+ random string of printable ASCII characters. */
function buildLargePaste(sizeBytes: number = 1_048_576): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \n\t"
  let result = ""
  while (result.length < sizeBytes) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

/** Build a 1 MB+ string containing random Unicode codepoints. */
function buildLargeUnicodePaste(sizeChars: number = 300_000): string {
  const codepoints = [
    0x4e00, 0x4e01, 0x4e02, 0x4e03, // CJK
    0x0041, 0x0042, 0x0043, // ASCII
    0x00e9, 0x00f1, 0x00fc, // Latin extended
    0x0627, 0x0628, 0x0629, // Arabic
    0x0410, 0x0411, 0x0412, // Cyrillic
    0x1f600, 0x1f601, 0x1f602, // Emoji
    0x0a, // newline
  ]
  let result = ""
  for (let i = 0; i < sizeChars; i++) {
    result += String.fromCodePoint(codepoints[Math.floor(Math.random() * codepoints.length)])
  }
  return result
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("paste overflow fuzz", () => {
  test("isPasteOverLimit does not crash on 1 MB input", () => {
    const large = buildLargePaste(1_048_576)
    expect(() => isPasteOverLimit(large)).not.toThrow()
  })

  test("isPasteOverLimit correctly identifies 1 MB input as over limit", () => {
    const large = buildLargePaste(1_048_576)
    expect(isPasteOverLimit(large)).toBe(true)
  })

  test("enforcePasteLimit does not crash on 1 MB input", () => {
    const large = buildLargePaste(1_048_576)
    expect(() => enforcePasteLimit(large)).not.toThrow()
  })

  test("enforcePasteLimit truncates 1 MB input to MAX_PASTE_SIZE + marker", () => {
    const large = buildLargePaste(1_048_576)
    const result = enforcePasteLimit(large)
    expect(result.length).toBe(MAX_PASTE_SIZE + "…[truncated]".length)
    expect(result.endsWith("…[truncated]")).toBe(true)
  })

  test("enforcePasteLimit preserves the first MAX_PASTE_SIZE characters", () => {
    const large = buildLargePaste(1_048_576)
    const result = enforcePasteLimit(large)
    expect(result.slice(0, MAX_PASTE_SIZE)).toBe(large.slice(0, MAX_PASTE_SIZE))
  })

  test("isPasteOverLimit handles large Unicode content", () => {
    const large = buildLargeUnicodePaste(300_000)
    expect(() => isPasteOverLimit(large)).not.toThrow()
    expect(isPasteOverLimit(large)).toBe(true)
  })

  test("enforcePasteLimit truncates large Unicode content without crashing", () => {
    const large = buildLargeUnicodePaste(300_000)
    expect(() => enforcePasteLimit(large)).not.toThrow()
    const result = enforcePasteLimit(large)
    expect(result.endsWith("…[truncated]")).toBe(true)
  })

  test("isPasteOverLimit with custom maxSize on 1 MB input", () => {
    const large = buildLargePaste(1_048_576)
    expect(isPasteOverLimit(large, 500)).toBe(true)
    expect(isPasteOverLimit(large, 2_000_000)).toBe(false)
  })

  test("enforcePasteLimit with custom maxSize truncates correctly", () => {
    const large = buildLargePaste(1_048_576)
    const result = enforcePasteLimit(large, 500)
    expect(result.length).toBe(500 + "…[truncated]".length)
    expect(result.endsWith("…[truncated]")).toBe(true)
  })

  test("content exactly at 1 MB boundary", () => {
    const exactly1MB = "a".repeat(1_048_576)
    expect(isPasteOverLimit(exactly1MB)).toBe(true)
    const result = enforcePasteLimit(exactly1MB)
    expect(result.endsWith("…[truncated]")).toBe(true)
  })

  test("mixed ANSI + large content: paste limit enforced after stripping", () => {
    // Simulate a paste that has ANSI but is still over limit after stripping
    let large = ""
    for (let i = 0; i < 200_000; i++) {
      large += Math.random() < 0.3 ? "\x1b[31m" : "x"
    }
    expect(isPasteOverLimit(large)).toBe(true)
    expect(() => enforcePasteLimit(large)).not.toThrow()
  })

  test("enforcePasteLimit result can be processed again without error", () => {
    const large = buildLargePaste(1_048_576)
    const pass1 = enforcePasteLimit(large)
    expect(() => enforcePasteLimit(pass1)).not.toThrow()
    const pass2 = enforcePasteLimit(pass1)
    // Second pass: content is now within limit, returned unchanged
    expect(pass2).toBe(pass1)
  })
})
