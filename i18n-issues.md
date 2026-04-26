# i18n 汉化问题记录 — OpenCode TUI

> 生成时间：2026-04-24
> 汉化覆盖率：~98%（基于用户可见字符串统计）

---

## 📊 汉化统计

| 指标 | 数值 |
|------|------|
| TUI 源文件总数 | 103 个 (.tsx/.ts) |
| 源代码行数 | 19,143 行 |
| i18n key 总数 | 617 个（en.ts / zh.ts 完全对齐） |
| t() 调用次数 | 592 次 |
| 使用 t() 的文件数 | 46 个 |

---

## 🚫 不可 i18n 的硬编码清单

以下硬编码英文经审计确认**不可或不宜**进行 i18n 化，附原因说明：

### 1. 品牌名 / 产品名

| 字符串 | 位置 | 原因 |
|--------|------|------|
| `"OpenCode"` | `sidebar/footer.tsx`, `feature-plugins/sidebar/footer.tsx` | 品牌名不翻译，等同于 "iPhone"、"GitHub" |
| `"OpenCode"` | `app.tsx` terminalTitle | 同上，已通过 `t("tui.app.terminalTitle")` 统一管理，但值仍为 "OpenCode" |

### 2. Context Provider 内部名称（调试标识）

| 字符串 | 位置 | 原因 |
|--------|------|------|
| `"Local"`, `"Exit"`, `"Sync"`, `"Config"` 等 | `context/*.tsx` 各 provider 的 `name` 属性 | SolidJS Context 内部调试标识，不渲染到用户界面 |
| `"prompt"`, `"session"`, `"sidebar"` 等 | `component/*/index.tsx` 各组件的 `name` 属性 | 同上，DevTools 调试用 |

### 3. HTTP / API 协议字段

| 字符串 | 位置 | 原因 |
|--------|------|------|
| `"authorization"`, `"Authorization"` | `worker.ts` | HTTP header 名称，协议规定不可翻译 |
| `"Bearer "` | `worker.ts` | OAuth token 前缀，协议规定 |

### 4. 错误类名（技术标识）

| 字符串 | 位置 | 原因 |
|--------|------|------|
| `"MessageAbortedError"` | `session/index.tsx` | 自定义 Error 类名，用于 `instanceof` 判断 |
| `"QuestionRejectedError"` | `session/index.tsx` | 同上 |

### 5. console.log 技术日志

| 字符串 | 位置 | 原因 |
|--------|------|------|
| `"Creating a session failed:"` | `prompt/index.tsx:689` | 开发调试日志，不面向终端用户 |
| 各类 `console.log/warn/error` | 多个文件 | 同上 |

### 6. 键名 / 配置标识

| 字符串 | 位置 | 原因 |
|--------|------|------|
| `"locale_toggle"` | `keybinds.ts`, `session/index.tsx` | 快捷键动作标识，不渲染 |
| `"agent_cycle"`, `"mode_toggle"` 等 | `keybinds.ts` | 同上 |

---

## ⚠️ 已知限制

1. **I18nProvider 外部的静态文本**：`toast.tsx`、`selection.ts`、`plugin/runtime.ts` 等文件不在 SolidJS 响应式上下文中，无法使用 `useI18n()`。采用**静态导入 `en` 字典**方案，这意味着这些文本在切换语言后不会动态更新（需要重启 TUI 才生效）。受影响的 key：
   - `tui.toast.unknownError`
   - `tui.app.copiedToClipboard`（selection.ts 中）
   - `tui.plugin.runtimeNotReady`
   - `tui.plugin.pathsSyncing`

2. **第三方插件文本**：通过 `@opencode-ai/plugin` 接口加载的外部插件，其 UI 文本不在本 i18n 体系管理范围内。

3. **终端宽度限制**：中文文本比英文更宽（CJK 字符占2列），在某些窄终端下可能导致布局溢出。已通过 key 命名规范和简洁翻译尽量规避。

4. **语言检测**：使用 `process.env.LANG` 检测系统语言，而非 `navigator.language`（终端环境无 navigator 对象）。

---

## 🔧 i18n 架构说明

```
i18n/
├── en.ts          # 英文字典（617 keys，权威源）
├── zh.ts          # 中文字典（617 keys，与 en.ts 完全对齐）
└── context/
    └── i18n.tsx   # I18nProvider + useI18n() hook
```

- **Key 命名规范**：`tui.{模块}.{功能}.{含义}`，例如 `tui.prompt.enterTextPlaceholder`
- **切换快捷键**：`locale_toggle`（默认 `Ctrl+L`）
- **状态栏指示器**：prompt 底栏显示 `[中文]` 或 `[EN]`，随语言切换实时更新
