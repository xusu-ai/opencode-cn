import { describe, test, expect } from "bun:test"
import { stripAnsi, stripControlChars, truncateToMaxLines } from "@tui/util/robustness"

// ---------------------------------------------------------------------------
// Helpers – generate Unicode edge-case payloads
// ---------------------------------------------------------------------------

/**
 * Build "Zalgo text" by stacking many combining diacritical marks
 * (U+0300 – U+036F) on a base character.
 */
function buildZalgoText(baseChars: number, combiningPerChar: number): string {
  let result = ""
  for (let i = 0; i < baseChars; i++) {
    // Base: a common printable character
    result += "A"
    // Stack combining marks
    for (let j = 0; j < combiningPerChar; j++) {
      result += String.fromCodePoint(0x0300 + Math.floor(Math.random() * (0x036f - 0x0300 + 1)))
    }
  }
  return result
}

/** Build a string with zero-width characters. */
function buildZeroWidthText(): string {
  const zwChars = [
    "\u200B", // Zero-width space
    "\u200C", // Zero-width non-joiner
    "\u200D", // Zero-width joiner
    "\uFEFF", // BOM / zero-width no-break space
    "\u2060", // Word joiner
    "\u180E", // Mongolian vowel separator
  ]
  let result = "Hello"
  for (const zw of zwChars) {
    result += zw
  }
  result += "World"
  return result
}

/** Build a string with RTL text and embedded LTR. */
function buildRtlText(): string {
  const arabic = "مرحبا بالعالم"
  const hebrew = "שלום עולם"
  const ltr = "Hello"
  return `${arabic} ${ltr} ${hebrew}`
}

/** Build a string with lone surrogate halves (invalid in well-formed UTF-16). */
function buildLoneSurrogates(): string {
  // In JavaScript strings, lone surrogates can still appear
  const highSurrogate = "\uD800" // Lone high surrogate
  const lowSurrogate = "\uDC00" // Lone low surrogate
  return `before${highSurrogate}mid${lowSurrogate}after`
}

/** Build a string with overlong UTF-8 style patterns (in JS string form). */
function buildOverlongPatterns(): string {
  // These are valid JS strings but represent edge cases that might
  // trip up byte-level processing
  const patterns = [
    "\u0000",       // NULL
    "\u00C0\u0080", // Overlong encoding of NULL in UTF-8 (decoded into JS string)
    "\u07FF",       // Max 2-byte UTF-8 codepoint
    "\u0800",       // Min 3-byte UTF-8 codepoint
    "\uFFFF",       // Max BMP codepoint
    "\uD800\uDC00", // Valid surrogate pair (U+10000)
    "\uDBFF\uDFFF", // Valid surrogate pair (U+10FFFF)
  ]
  return patterns.join("-")
}

/** Build a string with truncated multi-byte sequences (lone surrogates). */
function buildTruncatedMultibyte(): string {
  // Start of a surrogate pair without the matching half
  return `text\uD800more\uDC00end`
}

/** Build text with many Unicode line-breaking opportunities. */
function buildMultilineUnicode(lineCount: number): string {
  const lines: string[] = []
  const separators = ["\n", "\r\n", "\u2028", "\u2029"] // Line/paragraph separators
  for (let i = 0; i < lineCount; i++) {
    lines.push(`Line${i} 中文 العربية עברית`)
  }
  // Join with varying line separators for realism
  return lines.map((line, idx) => line + separators[idx % separators.length]).join("").replace(/\n$/, "")
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Unicode edge cases fuzz", () => {
  // --- Invalid / lone surrogates ---

  test("stripAnsi does not crash on lone surrogates", () => {
    const input = buildLoneSurrogates()
    expect(() => stripAnsi(input)).not.toThrow()
  })

  test("stripControlChars does not crash on lone surrogates", () => {
    const input = buildLoneSurrogates()
    expect(() => stripControlChars(input)).not.toThrow()
  })

  test("truncateToMaxLines does not crash on lone surrogates", () => {
    const input = buildLoneSurrogates()
    expect(() => truncateToMaxLines(input, 10)).not.toThrow()
  })

  // --- Overlong / boundary codepoints ---

  test("stripAnsi handles overlong and boundary codepoints", () => {
    const input = buildOverlongPatterns()
    expect(() => stripAnsi(input)).not.toThrow()
  })

  test("stripControlChars handles overlong and boundary codepoints", () => {
    const input = buildOverlongPatterns()
    expect(() => stripControlChars(input)).not.toThrow()
  })

  test("truncateToMaxLines handles overlong and boundary codepoints", () => {
    const input = buildOverlongPatterns()
    expect(() => truncateToMaxLines(input, 10)).not.toThrow()
  })

  // --- Truncated multi-byte ---

  test("stripAnsi does not crash on truncated multi-byte sequences", () => {
    const input = buildTruncatedMultibyte()
    expect(() => stripAnsi(input)).not.toThrow()
  })

  test("stripControlChars does not crash on truncated multi-byte sequences", () => {
    const input = buildTruncatedMultibyte()
    expect(() => stripControlChars(input)).not.toThrow()
  })

  test("truncateToMaxLines does not crash on truncated multi-byte sequences", () => {
    const input = buildTruncatedMultibyte()
    expect(() => truncateToMaxLines(input, 10)).not.toThrow()
  })

  // --- Zalgo text (heavy combining marks) ---

  test("stripAnsi does not crash on Zalgo text", () => {
    const input = buildZalgoText(100, 20)
    expect(() => stripAnsi(input)).not.toThrow()
  })

  test("stripControlChars does not crash on Zalgo text", () => {
    const input = buildZalgoText(100, 20)
    expect(() => stripControlChars(input)).not.toThrow()
  })

  test("stripControlChars preserves combining diacritical marks in Zalgo text", () => {
    const input = buildZalgoText(5, 10)
    const result = stripControlChars(input)
    // Combining marks should still be present
    expect(result.length).toBeGreaterThan(0)
    // Should still contain combining marks (U+0300-U+036F)
    const hasCombining = [...result].some(ch => {
      const cp = ch.codePointAt(0)!
      return cp >= 0x0300 && cp <= 0x036F
    })
    expect(hasCombining).toBe(true)
  })

  test("truncateToMaxLines handles Zalgo text correctly", () => {
    // Build Zalgo text with newlines
    const lines = Array.from({ length: 20 }, (_, i) => buildZalgoText(5, 5) + i)
    const input = lines.join("\n")
    expect(() => truncateToMaxLines(input, 5)).not.toThrow()
    const result = truncateToMaxLines(input, 5)
    // Should keep last 5 lines
    const resultLines = result.split("\n")
    expect(resultLines.length).toBe(6) // 1 notice line + 5 content lines
  })

  test("large Zalgo text (10K combining marks) does not crash", () => {
    const input = buildZalgoText(500, 20)
    expect(() => stripAnsi(input)).not.toThrow()
    expect(() => stripControlChars(input)).not.toThrow()
    expect(() => truncateToMaxLines(input, 100)).not.toThrow()
  })

  // --- RTL text ---

  test("stripAnsi handles RTL text", () => {
    const input = buildRtlText()
    expect(() => stripAnsi(input)).not.toThrow()
    // RTL text should pass through unchanged (no ANSI to strip)
    expect(stripAnsi(input)).toBe(input)
  })

  test("stripControlChars handles RTL text", () => {
    const input = buildRtlText()
    expect(() => stripControlChars(input)).not.toThrow()
    expect(stripControlChars(input)).toBe(input)
  })

  test("truncateToMaxLines handles RTL text", () => {
    const lines = Array.from({ length: 10 }, (_, i) => buildRtlText() + i)
    const input = lines.join("\n")
    expect(() => truncateToMaxLines(input, 3)).not.toThrow()
  })

  // --- Zero-width characters ---

  test("stripAnsi handles zero-width characters", () => {
    const input = buildZeroWidthText()
    expect(() => stripAnsi(input)).not.toThrow()
  })

  test("stripControlChars handles zero-width characters", () => {
    const input = buildZeroWidthText()
    expect(() => stripControlChars(input)).not.toThrow()
    // Zero-width chars are not control chars; they should be preserved
    expect(stripControlChars(input)).toBe(input)
  })

  test("truncateToMaxLines handles zero-width characters", () => {
    const input = buildZeroWidthText() + "\n" + buildZeroWidthText()
    expect(() => truncateToMaxLines(input, 5)).not.toThrow()
  })

  // --- Mixed stress ---

  test("stripAnsi + stripControlChars pipeline on mixed Unicode stress input", () => {
    const parts = [
      buildZalgoText(10, 5),
      buildRtlText(),
      buildZeroWidthText(),
      buildLoneSurrogates(),
      "\x1b[31mColored Zalgo: " + buildZalgoText(3, 10) + "\x1b[0m",
    ]
    const input = parts.join(" | ")
    expect(() => {
      const step1 = stripAnsi(input)
      stripControlChars(step1)
    }).not.toThrow()
  })

  test("truncateToMaxLines with Zalgo + RTL + zero-width per line", () => {
    const lines = Array.from({ length: 100 }, (_, i) => {
      return `${buildZalgoText(2, 3)} ${buildRtlText()} ${buildZeroWidthText()} line${i}`
    })
    const input = lines.join("\n")
    expect(() => truncateToMaxLines(input, 10)).not.toThrow()
    const result = truncateToMaxLines(input, 10)
    expect(result).toContain("earlier lines truncated")
  })

  test("Unicode line/paragraph separators are handled by truncateToMaxLines", () => {
    // U+2028 (line separator) and U+2029 (paragraph separator)
    // JavaScript split("\n") does NOT split on these — this test verifies
    // that the function doesn't crash even when they're present
    const input = "line1\u2028line2\u2029line3\nline4"
    expect(() => truncateToMaxLines(input, 2)).not.toThrow()
  })

  test("empty string edge cases", () => {
    expect(stripAnsi("")).toBe("")
    expect(stripControlChars("")).toBe("")
    expect(truncateToMaxLines("", 5)).toBe("")
  })

  test("string with only newlines", () => {
    const input = "\n\n\n\n\n"
    expect(() => truncateToMaxLines(input, 2)).not.toThrow()
    const result = truncateToMaxLines(input, 2)
    // "\n\n\n\n\n" splits to ["","","","","",""] = 6 lines; keep last 2 → 4 truncated
    expect(result).toContain("4 earlier lines truncated")
  })
})
