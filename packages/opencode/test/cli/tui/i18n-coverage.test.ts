import { beforeAll, describe, expect, test } from "bun:test"
import fs from "fs"
import path from "path"

/**
 * i18n key 覆盖率测试
 * 
 * 扫描所有 TUI 组件文件中的 t("tui.xxx") 调用，
 * 验证这些 key 在 en.ts 字典中存在。
 * 防止组件引用了不存在的翻译 key。
 */
describe("i18n key 覆盖率", () => {
  const tuiBase = path.resolve(import.meta.dir, "../../../src/cli/cmd/tui")

  let en: Record<string, string>
  let enKeys: Set<string>

  // 在 beforeAll 中动态加载，避免顶层 await
  beforeAll(async () => {
    en = (await import("../../../src/cli/cmd/tui/i18n/en")).default as Record<string, string>
    enKeys = new Set(Object.keys(en))
  })

  // 收集所有 t("tui.xxx") 调用
  function collectTcalls(dir: string): Map<string, string[]> {
    const result = new Map<string, string[]>()
    
    function walk(currentDir: string) {
      for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
        const fullPath = path.join(currentDir, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, "utf-8")
          // 匹配 t("tui.xxx") 和 t("tui.xxx.yyy") 调用
          // Use negative lookbehind to avoid matching writeHeapSnapshot("tui.xxx") etc.
          const matches = content.matchAll(/(?<![a-zA-Z0-9_.])t\(\s*"tui\.[a-zA-Z0-9_.]+"\s*[,)]/g)
          const keys: string[] = []
          for (const match of matches) {
            const key = match[0].match(/"tui\.[a-zA-Z0-9_.]+"/)![0].replace(/"/g, "")
            keys.push(key)
          }
          if (keys.length > 0) {
            const relPath = path.relative(tuiBase, fullPath)
            result.set(relPath, keys)
          }
        }
      }
    }
    
    walk(dir)
    return result
  }

  const tCalls = collectTcalls(tuiBase)
  const totalCalls = [...tCalls.values()].flat().length

  test(`找到 ${totalCalls} 个 t() 调用，所有引用的 key 必须存在于 en.ts`, () => {
    const missing: Array<{ file: string; key: string }> = []

    for (const [file, keys] of tCalls) {
      for (const key of keys) {
        if (!enKeys.has(key)) {
          missing.push({ file, key })
        }
      }
    }

    if (missing.length > 0) {
      console.error("❌ 以下 t() 调用引用了字典中不存在的 key:")
      for (const { file, key } of missing) {
        console.error(`   ${file}: t("${key}")`)
      }
    }

    expect(missing).toEqual([])
  })

  test("没有重复定义的 key (en.ts 内部唯一)", () => {
    const allKeys = Object.keys(en)
    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const key of allKeys) {
      if (seen.has(key)) {
        duplicates.push(key)
      }
      seen.add(key)
    }

    if (duplicates.length > 0) {
      console.error("❌ en.ts 中重复定义的 key:", duplicates)
    }

    expect(duplicates).toEqual([])
  })
})
