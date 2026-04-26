import { describe, test, expect } from "bun:test"
import { enforcePasteLimit, isPasteOverLimit, MAX_PASTE_SIZE } from "@tui/util/robustness"

describe("paste size limits", () => {
  describe("isPasteOverLimit", () => {
    test("normal-sized paste is not over limit", () => {
      const content = "Hello, this is a normal paste"
      expect(isPasteOverLimit(content)).toBe(false)
    })

    test("content exceeding MAX_PASTE_SIZE is over limit", () => {
      const content = "a".repeat(MAX_PASTE_SIZE + 1)
      expect(isPasteOverLimit(content)).toBe(true)
    })

    test("content exactly at MAX_PASTE_SIZE is not over limit", () => {
      const content = "a".repeat(MAX_PASTE_SIZE)
      expect(isPasteOverLimit(content)).toBe(false)
    })

    test("content one below MAX_PASTE_SIZE is not over limit", () => {
      const content = "a".repeat(MAX_PASTE_SIZE - 1)
      expect(isPasteOverLimit(content)).toBe(false)
    })

    test("empty string is not over limit", () => {
      expect(isPasteOverLimit("")).toBe(false)
    })
  })

  describe("enforcePasteLimit", () => {
    test("normal-sized paste is returned unchanged", () => {
      const content = "Hello, this is a normal paste"
      expect(enforcePasteLimit(content)).toBe(content)
    })

    test("oversized paste is truncated with marker", () => {
      const content = "a".repeat(MAX_PASTE_SIZE + 1000)
      const result = enforcePasteLimit(content)
      expect(result.length).toBe(MAX_PASTE_SIZE + "…[truncated]".length)
      expect(result.endsWith("…[truncated]")).toBe(true)
      // First MAX_PASTE_SIZE chars should be preserved
      expect(result.slice(0, MAX_PASTE_SIZE)).toBe("a".repeat(MAX_PASTE_SIZE))
    })

    test("content exactly at limit is returned unchanged", () => {
      const content = "x".repeat(MAX_PASTE_SIZE)
      expect(enforcePasteLimit(content)).toBe(content)
    })

    test("content one below limit is returned unchanged", () => {
      const content = "y".repeat(MAX_PASTE_SIZE - 1)
      expect(enforcePasteLimit(content)).toBe(content)
    })

    test("content one over limit is truncated", () => {
      const content = "z".repeat(MAX_PASTE_SIZE + 1)
      const result = enforcePasteLimit(content)
      expect(result.endsWith("…[truncated]")).toBe(true)
    })

    test("custom maxSize parameter works", () => {
      const content = "a".repeat(200)
      const result = enforcePasteLimit(content, 100)
      expect(result.length).toBe(100 + "…[truncated]".length)
      expect(result.endsWith("…[truncated]")).toBe(true)
    })

    test("empty string is returned unchanged", () => {
      expect(enforcePasteLimit("")).toBe("")
    })
  })

  describe("boundary value tests", () => {
    test("MAX_PASTE_SIZE constant is 100000", () => {
      expect(MAX_PASTE_SIZE).toBe(100_000)
    })

    test("exact boundary: at limit", () => {
      const atLimit = "A".repeat(MAX_PASTE_SIZE)
      expect(isPasteOverLimit(atLimit)).toBe(false)
      expect(enforcePasteLimit(atLimit)).toBe(atLimit)
    })

    test("exact boundary: one over limit", () => {
      const oneOver = "B".repeat(MAX_PASTE_SIZE + 1)
      expect(isPasteOverLimit(oneOver)).toBe(true)
      const result = enforcePasteLimit(oneOver)
      expect(result.endsWith("…[truncated]")).toBe(true)
    })

    test("exact boundary: one under limit", () => {
      const oneUnder = "C".repeat(MAX_PASTE_SIZE - 1)
      expect(isPasteOverLimit(oneUnder)).toBe(false)
      expect(enforcePasteLimit(oneUnder)).toBe(oneUnder)
    })

    test("zero-length content at custom maxSize", () => {
      // maxSize 0 means everything is over limit; slice(0,0) is empty
      expect(enforcePasteLimit("test", 0)).toBe("…[truncated]")
      expect(isPasteOverLimit("test", 0)).toBe(true)
    })

    test("single character at custom maxSize 1", () => {
      expect(enforcePasteLimit("A", 1)).toBe("A")
      expect(isPasteOverLimit("A", 1)).toBe(false)
      expect(isPasteOverLimit("AB", 1)).toBe(true)
    })
  })
})
