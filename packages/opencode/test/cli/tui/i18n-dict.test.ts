import { describe, expect, test } from "bun:test"
import en from "../../../src/cli/cmd/tui/i18n/en"
import zh from "../../../src/cli/cmd/tui/i18n/zh"

/**
 * i18n 字典完整性测试
 * 
 * 确保 en.ts 和 zh.ts 的 key 集合完全匹配，
 * 不会出现英文有而中文缺失（或反过来）的孤立 key。
 */
describe("i18n 字典完整性", () => {
  const enKeys = Object.keys(en).sort()
  const zhKeys = Object.keys(zh).sort()

  test("en 和 zh 的 key 数量相同", () => {
    expect(enKeys.length).toBe(zhKeys.length)
  })

  test("en 和 zh 的 key 集合完全匹配", () => {
    const enOnly = enKeys.filter((k) => !zhKeys.includes(k))
    const zhOnly = zhKeys.filter((k) => !enKeys.includes(k))

    if (enOnly.length > 0) {
      console.error("❌ en.ts 有但 zh.ts 缺失的 key:", enOnly)
    }
    if (zhOnly.length > 0) {
      console.error("❌ zh.ts 有但 en.ts 缺失的 key:", zhOnly)
    }

    expect(enOnly).toEqual([])
    expect(zhOnly).toEqual([])
  })

  test("所有 key 都以 tui. 前缀开头", () => {
    const badEn = enKeys.filter((k) => !k.startsWith("tui."))
    const badZh = zhKeys.filter((k) => !k.startsWith("tui."))

    expect(badEn).toEqual([])
    expect(badZh).toEqual([])
  })

  test("没有空字符串的翻译值", () => {
    const emptyEn = enKeys.filter((k) => en[k as keyof typeof en] === "")
    const emptyZh = zhKeys.filter((k) => zh[k as keyof typeof zh] === "")

    if (emptyEn.length > 0) {
      console.error("❌ en.ts 中有空值的 key:", emptyEn)
    }
    if (emptyZh.length > 0) {
      console.error("❌ zh.ts 中有空值的 key:", emptyZh)
    }

    expect(emptyEn).toEqual([])
    expect(emptyZh).toEqual([])
  })

  test("key 命名遵循 <domain>.<name> 层级结构", () => {
    // 每个key至少有2段：tui.xxx 或 tui.xxx.yyy
    const badKeys = enKeys.filter((k) => {
      const parts = k.split(".")
      return parts.length < 2
    })

    expect(badKeys).toEqual([])
  })
})
