import { describe, test, expect } from "bun:test"
import { truncateToMaxLines, DEFAULT_MAX_PART_LINES } from "@tui/util/robustness"

describe("truncateToMaxLines", () => {
  test("does not truncate when within limit", () => {
    const input = "line1\nline2\nline3"
    expect(truncateToMaxLines(input, 5)).toBe("line1\nline2\nline3")
  })

  test("does not truncate when exactly at limit", () => {
    const input = "line1\nline2\nline3"
    // 3 lines, limit 3 → no truncation
    expect(truncateToMaxLines(input, 3)).toBe("line1\nline2\nline3")
  })

  test("truncates oldest lines when over limit", () => {
    const input = "line1\nline2\nline3\nline4\nline5"
    const result = truncateToMaxLines(input, 3)
    // Should keep last 3 lines and prepend truncation notice
    expect(result).toBe("…(2 earlier lines truncated)\nline3\nline4\nline5")
  })

  test("truncation notice shows correct count", () => {
    const input = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join("\n")
    const result = truncateToMaxLines(input, 3)
    expect(result).toBe("…(7 earlier lines truncated)\nline8\nline9\nline10")
  })

  test("empty string returns empty", () => {
    expect(truncateToMaxLines("", 5)).toBe("")
  })

  test("single line text within limit is unchanged", () => {
    const input = "just one line, no newlines"
    expect(truncateToMaxLines(input, 5)).toBe("just one line, no newlines")
  })

  test("single line text at limit is unchanged", () => {
    const input = "just one line, no newlines"
    expect(truncateToMaxLines(input, 1)).toBe("just one line, no newlines")
  })

  test("very long single-line text counts as one line", () => {
    const input = "a".repeat(1_000_000)
    const result = truncateToMaxLines(input, 5)
    // Single line → no truncation regardless of length
    expect(result).toBe(input)
    expect(result.length).toBe(1_000_000)
  })

  test("maxLines of 0 returns empty string", () => {
    const input = "line1\nline2"
    expect(truncateToMaxLines(input, 0)).toBe("")
  })

  test("maxLines of 1 keeps only last line", () => {
    const input = "line1\nline2\nline3"
    const result = truncateToMaxLines(input, 1)
    expect(result).toBe("…(2 earlier lines truncated)\nline3")
  })

  test("works with default maxLines constant (5000)", () => {
    // Build 5001 lines
    const lines = Array.from({ length: 5001 }, (_, i) => `line${i + 1}`)
    const input = lines.join("\n")
    const result = truncateToMaxLines(input)
    expect(result).toContain("1 earlier lines truncated")
    expect(result.endsWith("line5001")).toBe(true)
  })

  test("preserves trailing empty line semantics", () => {
    // "a\nb\n" splits to ["a", "b", ""] = 3 elements
    const input = "a\nb\n"
    const result = truncateToMaxLines(input, 3)
    expect(result).toBe("a\nb\n")
  })
})
