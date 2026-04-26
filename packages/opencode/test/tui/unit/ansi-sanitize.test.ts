import { describe, test, expect } from "bun:test"
import { stripAnsi, stripControlChars } from "@tui/util/robustness"

describe("stripAnsi", () => {
  test("removes CSI color sequences", () => {
    const input = "\x1b[31mRed text\x1b[0m"
    expect(stripAnsi(input)).toBe("Red text")
  })

  test("removes CSI cursor movement sequences", () => {
    const input = "\x1b[2J\x1b[HHello"
    expect(stripAnsi(input)).toBe("Hello")
  })

  test("removes OSC title sequences (BEL terminator)", () => {
    const input = "\x1b]0;My Title\x07rest"
    expect(stripAnsi(input)).toBe("rest")
  })

  test("removes OSC title sequences (ST terminator)", () => {
    const input = "\x1b]0;My Title\x1b\\rest"
    expect(stripAnsi(input)).toBe("rest")
  })

  test("removes DCS sequences", () => {
    // DCS: ESC P ... ESC \
    const input = "\x1bPsomething\x1b\\visible"
    expect(stripAnsi(input)).toBe("visible")
  })

  test("removes multiple mixed sequences", () => {
    const input = "\x1b[1;32m\x1b]0;title\x07Hello \x1b[0mWorld"
    expect(stripAnsi(input)).toBe("Hello World")
  })

  test("handles empty string", () => {
    expect(stripAnsi("")).toBe("")
  })

  test("plain text without ANSI is unchanged", () => {
    const input = "Hello, world!"
    expect(stripAnsi(input)).toBe("Hello, world!")
  })

  test("handles SGR reset sequence", () => {
    const input = "\x1b[0m"
    expect(stripAnsi(input)).toBe("")
  })

  test("handles 256-color and true-color CSI sequences", () => {
    const input256 = "\x1b[38;5;196mRed256\x1b[0m"
    expect(stripAnsi(input256)).toBe("Red256")
    const inputTrue = "\x1b[38;2;255;0;0mTrueRed\x1b[0m"
    expect(stripAnsi(inputTrue)).toBe("TrueRed")
  })
})

describe("stripControlChars", () => {
  test("removes C0 control characters but preserves printable text", () => {
    // BEL (0x07), BS (0x08), NULL (0x00) embedded in text
    const input = "Hello\x07World\x00!"
    expect(stripControlChars(input)).toBe("HelloWorld!")
  })

  test("preserves newlines (LF)", () => {
    const input = "Line1\nLine2\nLine3"
    expect(stripControlChars(input)).toBe("Line1\nLine2\nLine3")
  })

  test("preserves carriage returns (CR)", () => {
    const input = "Line1\rLine2"
    expect(stripControlChars(input)).toBe("Line1\rLine2")
  })

  test("preserves tabs", () => {
    const input = "Col1\tCol2\tCol3"
    expect(stripControlChars(input)).toBe("Col1\tCol2\tCol3")
  })

  test("pure control character input returns empty string", () => {
    const input = "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x0b\x0c\x0e\x0f\x7f"
    expect(stripControlChars(input)).toBe("")
  })

  test("handles empty string", () => {
    expect(stripControlChars("")).toBe("")
  })

  test("removes C1 control characters (0x80-0x9F)", () => {
    // C1 CSI (0x9B) and others
    const input = "Text\x80\x81\x9b\x9fMore"
    expect(stripControlChars(input)).toBe("TextMore")
  })

  test("removes ESC (0x1B) which is a control character", () => {
    const input = "Before\x1bAfter"
    expect(stripControlChars(input)).toBe("BeforeAfter")
  })

  test("preserves Unicode printable characters", () => {
    const input = "你好世界 🌍 café"
    expect(stripControlChars(input)).toBe("你好世界 🌍 café")
  })

  test("mixed control and printable characters", () => {
    // NUL in between words, DEL at end
    const input = "Hello\x00World\x7f"
    expect(stripControlChars(input)).toBe("HelloWorld")
  })
})
