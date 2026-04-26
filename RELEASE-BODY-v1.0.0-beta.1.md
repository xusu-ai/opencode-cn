# opencode v1.0.0-beta.1 — 工业级终端 AI 编码助手

> 🏆 首个公开测试版 — 历经六轮系统性加固，达到工业级稳定性

---

## 🌐 国际化 (i18n)

OpenCode TUI 现支持**中英双语**即时切换：

- **634+ 翻译键**覆盖所有 TUI 元素 — 命令面板、状态栏、对话框、提示、帮助、错误信息
- `/locale zh` / `/locale en` — 即时切换，无需重启
- 缺失键自动回退英文，防止界面空白
- 类型安全的 `Dictionary` 约束确保翻译键完整性

## 🔒 安全加固（六轮）

全面安全审计发现 **36 项问题**，**8 项关键/高危漏洞已修复**：

### 已修复
- **路径遍历绕过** — `AppFileSystem.contains()` 添加 `path.resolve()` 规范化
- **Hunk 路径逃逸** — `applyHunksToFiles()` 验证 workdir 边界
- **环境变量泄露** — `sanitizedProcessEnv()` 过滤 `*_API_KEY`、`*_TOKEN`、`NODE_OPTIONS`、`LD_PRELOAD`
- **Crash dump 泄密** — `redactSensitiveInfo()` 双模式脱敏
- **HTTP 500 堆栈泄露** — 服务器错误不再暴露堆栈跟踪
- **剪贴板 TOCTOU** — 随机临时文件后缀防止符号链接竞争
- **MCP 输出 ANSI 注入** — 控制符在渲染前剥离
- **Transcript ANSI 注入** — `stripAnsi()` 清洗工具输出

### 安全测试
- **132 项安全专项测试**覆盖 5 个文件
- **CI 安全流水线** — 6-job workflow + Dependabot 每周依赖更新

## ⚡ 性能与诊断

- **`/diag` 命令** — 实时性能面板（渲染统计、内存、事件循环）
- **虚拟消息列表** — `MAX_VISIBLE_MESSAGES=50`，支持 10 万+消息会话
- **文本背压** — `MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000`
- **Crash dump** — 自动生成 + 敏感信息脱敏
- **输入防抖** — 避免不必要重渲染

## 🛡️ 稳定性

- **11 处事件监听器泄漏修复** — `onCleanup()` 防止内存泄漏
- **15 项深度内存安全补丁** — 崩溃预防
- **存储引擎容错** — KV 不可用时优雅降级
- **Locale 回退** — 缺失 i18n 键回退英文

## 📊 核心指标

| 指标 | 数值 |
|------|------|
| 加固轮次 | 6 |
| 修复缺陷 | 60+ |
| 测试总数 | 248 pass / 0 fail |
| 安全测试 | 132 |
| 安全审计 | 36 发现 / 8 已修复 |
| TypeScript 错误 | 0 |
| i18n 翻译键 | 634+ |

## 📝 文档

- [PROJECT-STATUS.md](./PROJECT-STATUS.md) — 综合质量仪表板
- [SECURITY-REPORT.md](./SECURITY-REPORT.md) — 36 项安全审计完整报告
- [SECURITY.md](./SECURITY.md) — 安全策略与已知限制
- [PERF-REPORT.md](./PERF-REPORT.md) — 性能优化报告
- [STABILITY-REPORT.md](./STABILITY-REPORT.md) — 稳定性加固报告
- [CHANGELOG.md](./CHANGELOG.md) — 完整变更日志
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献指南

## ⚠️ 已知限制

- Bash 工具使用 `shell: true` 执行 LLM 命令（权限系统是 UX 功能，非安全边界）
- 模板参数插值未做 shell 转义（by-design）
- MCP 配置命令从 `opencode.json` 执行（用户控制配置）
- KV 存储可能包含明文密钥（建议使用系统密钥链）

---

**完整变更**: [CHANGELOG.md](./CHANGELOG.md)
**安全详情**: [SECURITY.md](./SECURITY.md)
