# opencode TUI i18n 汉化报告

生成时间：2026-04-24

## 📊 当前汉化统计

| 指标 | 数值 |
|------|------|
| 语言包 key 总数 | 621 |
| t() 调用总数 | 593 |
| 覆盖源文件数 | 47 |
| en.ts / zh.ts 对齐 | ✅ 完全对齐 |
| TS 编译错误（本次修改） | 0 |

### 支持语言
- `en` — English（默认）
- `zh` — 中文

### 切换方式
- `/locale zh` 或 `/locale en` 命令
- `<leader>i` 快捷键（调用 `toggleLocale()`）
- 状态栏 locale 指示器：中文模式显示"中"，英文模式显示"EN"

---

## ✅ 已完成 i18n 化的硬编码项（本次修复）

| 文件 | 原硬编码字符串 | i18n key |
|------|--------------|----------|
| `feature-plugins/sidebar/lsp.tsx` | `"LSPs have been disabled in settings"` | `tui.lsp.disabledInSettings` |
| `feature-plugins/sidebar/lsp.tsx` | `"LSPs will activate as files are read"` | `tui.lsp.willActivateOnRead` |
| `thread.ts` | `"Failed to change directory to "` | `tui.thread.failedToChdir` |
| `attach.ts` / `thread.ts` | `"--fork requires --continue or --session"` | `tui.attach.forkRequiresContinueOrSession` |
| `prompt/index.tsx` | locale 指示器 `i18n.locale()` → `i18n.locale`（getter 修复） | — |

### 修复的 TS 编译错误
- `prompt/index.tsx:1358,1366` — `i18n.locale()` 是 getter，不应加 `()`，已改为 `i18n.locale`

---

## 🔒 不可翻译的硬编码清单

以下字符串属于内部/调试/协议用途，**不应 i18n 化**：

### 1. 控制台日志（console.log/error/warn）
| 文件 | 字符串 |
|------|--------|
| `context/kv.tsx:37` | `"Failed to read KV state"` |
| `context/kv.tsx:70` | `"Failed to write KV state"` |
| `component/dialog-mcp.tsx:67` | `"Failed to refresh MCP status: no data returned"` |
| `component/dialog-mcp.tsx:70` | `"Failed to toggle MCP:"` |
| `component/prompt/index.tsx:689` | `"Creating a session failed:"` |
| `util/clipboard.ts` | `"clipboard: using osascript/wl-copy/xclip/xsel/powershell"` |
| `util/clipboard.ts:192` | `"clipboard: no native support"` |
| `plugin/slots.tsx:41` | `"[tui.slot] plugin error"` |
| `plugin/runtime.ts:93,100,105` | `"[tui.plugin] ..."` |
| `app.tsx:84` | `"Failed to copy console selection to clipboard: ..."` |
| `app.tsx:258` | `"Failed to load TUI plugins"` |

### 2. 组件内部标识名
| 文件 | 字符串 |
|------|--------|
| `component/prompt/frecency.tsx:19` | `name: "Frecency"` |
| `component/prompt/history.tsx:31` | `name: "PromptHistory"` |
| `component/prompt/stash.tsx:19` | `name: "PromptStash"` |

### 3. 协议/状态常量
| 文件 | 字符串 |
|------|--------|
| `component/prompt/index.tsx:75` | `currency: "USD"` |
| `routes/session/subagent-footer.tsx:51` | `currency: "USD"` |
| `feature-plugins/sidebar/context.tsx:10` | `currency: "USD"` |
| `ui/dialog-select.tsx:268` | `status: "FILTER"` |
| `ui/dialog-prompt.tsx:53` | `status: "BUSY"` |
| `ui/dialog-export-options.tsx:107` | `status: "FILENAME"` |
| `routes/session/permission.tsx:538` | `status: "REJECT"` |
| `routes/session/question.tsx:385` | `status: "ANSWER"` |

### 4. Zod Schema 描述（仅供开发者参考）
| 文件 | 说明 |
|------|------|
| `config/tui-schema.ts` | 多个 `.describe("...")` 调用，用于配置文档生成，非用户界面文本 |

---

## ⚠️ 已知限制

1. **非组件模块的 i18n** — `thread.ts` 和 `attach.ts` 不是 SolidJS 组件，无法使用 `useI18n()` Hook。当前方案直接 `import en from "./i18n/en"` 使用英文翻译字典。这意味着在这两个文件中，UI.error() 消息始终显示英文，不会响应式切换。这是架构限制，因为它们在 React/Solid 上下文之外运行。

2. **zh.ts 格式不一致** — zh.ts 中有 9 个 tip key 的值使用单引号 `'...'` 而非双引号 `"..."`（因为值内包含双引号转义），功能正常但风格不统一。

3. **第三方组件** — opentui/solid 内置组件（如 Dialog、Input 等）的内部文本不受 i18n 系统控制。

4. **plugin/runtime.ts** — 插件系统的错误消息通过 `console.error` 输出，属于调试信息，不翻译。

---

## 📁 新增 key 汇总

| key | en | zh |
|-----|----|----|
| `tui.lsp.disabledInSettings` | LSPs have been disabled in settings | LSP 已在设置中禁用 |
| `tui.lsp.willActivateOnRead` | LSPs will activate as files are read | LSP 将在读取文件时自动激活 |
| `tui.thread.failedToChdir` | Failed to change directory to | 无法切换目录到 |
| `tui.attach.forkRequiresContinueOrSession` | --fork requires --continue or --session | --fork 需要 --continue 或 --session |
