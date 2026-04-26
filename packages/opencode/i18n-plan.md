# OpenCode TUI 全量 i18n 汉化计划

## 一、项目技术栈分析

| 项目 | 详情 |
|------|------|
| **框架** | SolidJS (Reactive UI) + Ink (Terminal TUI) |
| **语言** | TypeScript |
| **构建** | Vite + tsc |
| **国际化库** | `@solid-primitives/i18n` (已集成) |
| **语言包格式** | `.ts` 文件导出 `Record<string, string>` (非 JSON) |
| **翻译函数** | `t("key")` + `t("key", { var: value })` 插值 |
| **上下文** | `useI18n()` hook → `{ t, locale, setLocale, toggleLocale }` |
| **语言检测** | `process.env.LANG` / `LC_ALL` / `LC_MESSAGES` |
| **持久化** | KV 存储（文件系统，非 localStorage） |

### i18n 架构已实现
- ✅ `context/i18n.tsx` — I18nProvider + useI18n + detectLocale + KV持久化
- ✅ `i18n/en.ts` — 460 keys 英文语言包
- ✅ `i18n/zh.ts` — 460 keys 中文语言包
- ✅ 28 个文件已有 `t()` 调用
- ✅ `tui.command.switchLanguage` key 已预留

### 待完成
- ❌ 83 个文件仍有硬编码英文字符串
- ❌ LocaleSwitcher UI 组件（终端快捷键触发）
- ❌ KV 持久化集成到 App 入口
- ❌ 全局硬编码审计

## 二、文件清单与优先级

### 总计：111 个源码文件

### 已完成 i18n 的文件（28个，460 keys）
app.tsx, routes/home.tsx, routes/session/index.tsx, routes/session/footer.tsx, 
routes/session/sidebar.tsx, routes/session/question.tsx, routes/session/dialog-message.tsx,
routes/session/dialog-timeline.tsx, routes/session/dialog-fork-from-timeline.tsx,
routes/session/dialog-subagent.tsx, component/dialog-command.tsx,
component/dialog-console-org.tsx, component/dialog-go-upsell.tsx,
component/dialog-model.tsx, component/dialog-variant.tsx,
component/dialog-theme-list.tsx, component/startup-loading.tsx,
component/error-component.tsx, component/bg-pulse.tsx, feature-plugins/system/plugins.tsx,
ui/dialog.tsx, ui/dialog-confirm.tsx, ui/dialog-alert.tsx, ui/dialog-select.tsx,
ui/dialog-help.tsx, ui/dialog-export-options.tsx, ui/toast.tsx, ui/spinner.ts

### 待汉化文件（按优先级分组）

#### P0 - 已有部分 t() 但仍有硬编码（~40个字符串）
| 文件 | 硬编码数 | 说明 |
|------|---------|------|
| component/prompt/index.tsx | 6 | Prompt/Session 标签 |
| component/dialog-workspace-create.tsx | 9 | 工作区创建消息 |
| component/dialog-session-list.tsx | 5 | 会话列表标题/错误 |
| component/dialog-provider.tsx | 3 | Provider 提示 |
| context/local.tsx | 3 | 本地Provider消息 |
| routes/session/permission.tsx | 1 | "Unknown" 标签 |
| component/dialog-mcp.tsx | ~2 | MCP 对话框 |
| config/tui.ts | ~1 | 配置描述 |
| 其余 | ~10 | 零散字符串 |

#### P1 - 核心UI组件（~30个字符串）
| 文件 | 硬编码数 | 说明 |
|------|---------|------|
| component/dialog-skill.tsx | 2 | Skills 对话框 |
| component/dialog-stash.tsx | 1 | Stash 对话框 |
| component/dialog-tag.tsx | 1 | Autocomplete 标签 |
| ui/dialog-prompt.tsx | 2 | Prompt 对话框 |
| feature-plugins/home/tips.tsx | 2 | Tips 开关 |
| feature-plugins/sidebar/*.tsx | ~15 | 侧边栏菜单 |
| routes/session/subagent-footer.tsx | 2 | 子代理页脚 |

#### P2 - Tips 提示系统（~91个字符串）
| 文件 | 硬编码数 | 说明 |
|------|---------|------|
| feature-plugins/home/tips-view.tsx | 91 | 所有键盘快捷键提示 |

#### P3 - 上下文/配置/工具文件
| 文件 | 说明 | 是否需要汉化 |
|------|------|-------------|
| context/args.tsx | Context name "Args" | ❌ 非UI，调试标识 |
| context/exit.tsx | Context name "Exit" | ❌ |
| context/keybind.tsx | Context name "Keybind" | ❌ |
| context/kv.tsx | console.error 消息 | ❌ 日志非UI |
| context/project.tsx | Context name "Project" | ❌ |
| context/prompt.tsx | Context name "PromptRef" | ❌ |
| context/route.tsx | Context name "Route" | ❌ |
| context/sync.tsx | Context name "Sync" | ❌ |
| context/theme.tsx | Context name "Theme" | ❌ |
| context/tui-config.tsx | Context name "TuiConfig" | ❌ |
| config/cwd.ts | Context name | ❌ |
| config/tui-schema.ts | zod .describe() | ⚠️ 配置描述，低优先 |
| plugin/runtime.ts | 日志消息 | ❌ |
| util/* | 工具函数 | ❌ 无UI字符串 |

### 排除规则
- `console.log/warn/error` → 不汉化（日志非用户可见）
- `Context.Reference("Name")` → 不汉化（调试标识）
- `zod.describe()` → 低优先，配置文件描述
- `import` 语句 → 不处理
- CSS 类名/属性 → 不处理
- 正则表达式 → 不处理
- `Effect.fn("name")` → 不汉化（Effect 追踪标识）

## 三、Key 命名规范

格式：`tui.<模块>.<含义>`

示例：
- `tui.workspace.createFailed` — 工作区创建失败
- `tui.session.today` — "Today" 分类
- `tui.tips.fuzzySearch` — 文件模糊搜索提示
- `tui.sidebar.files` — 侧边栏"Files"

## 四、翻译原则

1. **技术术语保留英文**：API, MCP, LSP, Provider, Session, Stash, Frecency
2. **动词翻译**：Creating → 创建中, Loading → 加载中
3. **错误消息**：Failed to X → X失败
4. **状态标签**：Today → 今天, Sessions → 会话
5. **占位符保留**：`{{version}}`, `{highlight}`, `{count}` 等

## 五、LocaleSwitcher 设计（TUI 适配）

终端TUI环境特殊性：
- 无鼠标/按钮 → 使用快捷键 `Ctrl+X L` 或 `/lang` 命令
- 状态栏显示当前语言标识 → `[中]` / `[EN]`
- 切换后即时响应（SolidJS 响应式）

## 六、进度记录

| 日期 | 批次 | 文件数 | Key数 | 状态 |
|------|------|--------|-------|------|
| 2026-04-24 | Phase 1 初始 | 28 | 460 | ✅ 已完成 |
| 2026-04-24 | Batch 1 | ~14 | ~40 | 🔄 进行中 |
