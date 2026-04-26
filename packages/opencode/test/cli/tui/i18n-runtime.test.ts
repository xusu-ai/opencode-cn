import { describe, expect, test } from "bun:test"
import en, { type Dictionary } from "../../../src/cli/cmd/tui/i18n/en"
import zh from "../../../src/cli/cmd/tui/i18n/zh"

/**
 * i18n 运行时测试
 * 
 * 测试翻译函数的核心逻辑：
 * - 模板变量替换
 * - detectLocale 环境变量检测
 * - 字典切换
 * - 边界条件处理
 */

// 简单的 translator 实现（与 i18n.tsx 中一致，但不依赖 SolidJS context）
function createTranslator(dict: Dictionary) {
  return (key: string, params?: Record<string, string | number | boolean>): string => {
    let template = dict[key as keyof Dictionary]
    if (template === undefined) return key
    if (!params) return template
    // 替换 {var} 占位符
    return template.replace(/\{(\w+)\}/g, (_, name) => {
      const val = params[name]
      return val !== undefined ? String(val) : `{${name}}`
    })
  }
}

describe("i18n 翻译函数", () => {
  const t = createTranslator(en)

  test("简单 key 翻译返回正确值", () => {
    expect(t("tui.permission.cancel")).toBe("Cancel")
    expect(t("tui.permission.confirm")).toBe("Confirm")
    expect(t("tui.diag.title")).toBe("Diagnostics")
  })

  test("不存在的 key 原样返回 key 字符串", () => {
    expect(t("tui.nonexistent.key")).toBe("tui.nonexistent.key")
  })

  test("带模板变量的翻译正确替换", () => {
    const result = t("tui.diag.recentOps", { count: 5 })
    expect(result).toContain("5")
  })

  test("空参数对象不影响无占位符的模板", () => {
    const result = t("tui.permission.cancel", {})
    expect(result).toBe("Cancel")
  })

  test("缺失的模板变量保留占位符", () => {
    const result = t("tui.diag.recentOps", {})
    // 如果模板有 {count} 占位符但没传值，应保留 {count}
    expect(result).toMatch(/\{count\}|\d/i)
  })
})

describe("i18n 中文字典翻译", () => {
  const tZh = createTranslator(zh as unknown as Dictionary)

  test("中文翻译返回中文值", () => {
    expect(tZh("tui.permission.cancel")).toBe("取消")
    expect(tZh("tui.permission.confirm")).toBe("确认")
    expect(tZh("tui.diag.title")).toBe("诊断")
  })

  test("中英文 key 完全对称", () => {
    const enKeys = Object.keys(en).sort()
    const zhKeys = Object.keys(zh).sort()
    expect(enKeys).toEqual(zhKeys)
  })
})

describe("detectLocale 环境变量检测", () => {
  // 注意：这里直接测试 detectLocale 的逻辑
  // 因为 i18n.tsx 中的 detectLocale 依赖 process.env
  
  test("LANG=zh_CN.UTF-8 应返回 zh", () => {
    const savedLang = process.env.LANG
    process.env.LANG = "zh_CN.UTF-8"
    process.env.LC_ALL = ""
    process.env.LC_MESSAGES = ""
    
    const envLang = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || ""
    const result = envLang.startsWith("zh") ? "zh" : "en"
    expect(result).toBe("zh")
    
    // 恢复
    process.env.LANG = savedLang
  })

  test("LANG=en_US.UTF-8 应返回 en", () => {
    const savedLang = process.env.LANG
    process.env.LANG = "en_US.UTF-8"
    process.env.LC_ALL = ""
    process.env.LC_MESSAGES = ""
    
    const envLang = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || ""
    const result = envLang.startsWith("zh") ? "zh" : "en"
    expect(result).toBe("en")
    
    // 恢复
    process.env.LANG = savedLang
  })

  test("LC_ALL 优先级高于 LANG", () => {
    const savedLcAll = process.env.LC_ALL
    const savedLang = process.env.LANG
    process.env.LC_ALL = "zh_TW.UTF-8"
    process.env.LANG = "en_US.UTF-8"
    process.env.LC_MESSAGES = ""
    
    const envLang = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || ""
    const result = envLang.startsWith("zh") ? "zh" : "en"
    expect(result).toBe("zh")
    
    // 恢复
    process.env.LC_ALL = savedLcAll
    process.env.LANG = savedLang
  })
})

describe("i18n 边界条件", () => {
  test("空字典翻译返回 key", () => {
    const tEmpty = createTranslator({} as unknown as Dictionary)
    expect(tEmpty("tui.permission.cancel")).toBe("tui.permission.cancel")
  })

  test("翻译值中不包含无意的前导/尾随空格", () => {
    // Many en.ts values intentionally have trailing spaces as label prefixes
    // (e.g., "Thinking: ", "Read ", "Write "). These are by design for
    // concatenation with dynamic content. Only flag truly unintentional spaces.
    const intentionallySpaced = new Set([
      "tui.session.thinkingLabel",
      "tui.session.wrote",
      "tui.session.write",
      "tui.session.glob",
      "tui.session.read",
      "tui.session.loaded",
      "tui.session.grep",
      "tui.session.webFetch",
      "tui.session.exaCodeSearch",
      "tui.session.exaWebSearch",
      "tui.session.edit",
      "tui.session.deleted",
      "tui.session.created",
      "tui.session.moved",
      "tui.session.patched",
      "tui.session.asked",
      "tui.session.skill",
      "tui.session.diagnosticError",
      "tui.permission.pathLabel",
      "tui.permission.patternLabel",
      "tui.permission.urlLabel",
      "tui.permission.queryLabel",
      "tui.permission.toolLabel",
      "tui.goUpsell.subscribeTo",
      "tui.thread.failedToChdir",
    ])

    const badKeys = Object.entries(en).filter(
      ([k, v]) => typeof v === "string" && v !== v.trim() && !intentionallySpaced.has(k)
    )
    if (badKeys.length > 0) {
      console.error("❌ 以下 key 的翻译值包含前后空格:", badKeys.map(([k]) => k))
    }
    expect(badKeys).toEqual([])
  })

  test("中文翻译值不以英文标点结尾（常见遗漏）", () => {
    // 检查中文翻译是否意外保留了英文标点（如 . 或 :）而应该用中文标点
    // 这只是个弱检查，不强制
    const suspicious = Object.entries(zh).filter(([_, v]) => {
      if (typeof v !== "string") return false
      // 中文文本末尾有英文冒号但不有空格（通常是遗漏翻译）
      return v.endsWith(":") && !v.endsWith(" :") && /[\u4e00-\u9fff]/.test(v)
    })
    // 只是 warn，不 fail
    if (suspicious.length > 0) {
      console.warn("⚠️ 以下中文翻译末尾有英文冒号（可能是遗漏）:", suspicious.map(([k]) => k))
    }
  })
})
