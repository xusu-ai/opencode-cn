import { describe, test, expect } from "bun:test"
import { createFallbackTranslator } from "@tui/util/robustness"

// Minimal dictionaries matching the shape used in context/i18n.tsx
const enDict: Record<string, string> = {
  "tui.command.switchSession": "Switch session",
  "tui.command.newSession": "New session",
  "tui.prompt.label": "Prompt",
  "tui.session.label": "Session",
}

const zhDict: Record<string, string> = {
  "tui.command.switchSession": "切换会话",
  "tui.command.newSession": "新建会话",
  // Intentionally missing "tui.prompt.label" and "tui.session.label"
}

describe("i18n fallback translator", () => {
  test("existing key in current dict returns correct translation", () => {
    const t = createFallbackTranslator({ dict: zhDict, enDict, locale: "zh" })
    expect(t("tui.command.switchSession")).toBe("切换会话")
  })

  test("missing key in zh dict falls back to English (not undefined)", () => {
    const t = createFallbackTranslator({ dict: zhDict, enDict, locale: "zh" })
    const result = t("tui.prompt.label")
    expect(result).toBe("Prompt")
    expect(result).not.toBeUndefined()
  })

  test("missing key in both dicts when locale is en returns undefined", () => {
    const t = createFallbackTranslator({ dict: enDict, enDict, locale: "en" })
    const result = t("tui.nonexistent.key")
    // When locale is "en" there is no fallback to try — result is undefined
    expect(result).toBeUndefined()
  })

  test("missing key in both dicts when locale is zh falls back to en (which also missing → undefined)", () => {
    const t = createFallbackTranslator({ dict: zhDict, enDict, locale: "zh" })
    const result = t("tui.nonexistent.key")
    // Falls back to enDict, which also doesn't have it → undefined
    expect(result).toBeUndefined()
  })

  test("empty string key does not crash", () => {
    const t = createFallbackTranslator({ dict: zhDict, enDict, locale: "zh" })
    // Should not throw — simply returns undefined
    const result = t("")
    expect(result).toBeUndefined()
  })

  test("existing key in en locale returns value directly", () => {
    const t = createFallbackTranslator({ dict: enDict, enDict, locale: "en" })
    expect(t("tui.command.newSession")).toBe("New session")
  })

  test("all zh keys present returns zh values without fallback", () => {
    const fullZh: Record<string, string> = { ...zhDict, "tui.prompt.label": "提示", "tui.session.label": "会话" }
    const t = createFallbackTranslator({ dict: fullZh, enDict, locale: "zh" })
    expect(t("tui.prompt.label")).toBe("提示")
    expect(t("tui.session.label")).toBe("会话")
  })
})
