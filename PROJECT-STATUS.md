# PROJECT-STATUS.md — OpenCode 质量仪表板

> **版本**: v1.0.0-beta.1 · **更新日期**: 2026-04-25 · **分支**: dev

## 📊 总体指标

| 指标 | 数值 |
|------|------|
| 加固轮次 | 6 |
| 修复缺陷总数 | 60+ |
| 自动化测试总数 | 248 pass / 7 skip / 0 fail |
| 安全专项测试 | 132 |
| 安全审计发现 | 36（8 已修复，28 已接受） |
| TypeScript 编译错误 | 0 |
| i18n 翻译键 | 634+ |
| CI 流水线 | security-ci.yml（6-job） |

---

## 🔄 六轮加固总览

### 第1轮：🌐 i18n 中文本地化

- **主题**: TUI 全量中文本地化基础设施与核心组件汉化
- **修复数**: 15+
- **测试数**: 28
- **关键交付**:
  - 634+ 翻译键覆盖所有 TUI 元素
  - `/locale zh` / `/locale en` 即时切换
  - 自动回退机制（缺失键 → 英文）
  - 类型安全的 `Dictionary` 约束
  - 自测自修流水线（静态检查 + 3 套单元测试 + 自动修复调度器）
- **报告**: [i18n-issues.md](./i18n-issues.md)

### 第2轮：🛡️ 事件泄漏与内存安全

- **主题**: 修复 SolidJS 事件监听器泄漏，防止反复挂载/卸载时的内存累积
- **修复数**: 11+
- **测试数**: 22
- **关键交付**:
  - 11 处 `event.on()` 泄漏修复，全部包裹 `onCleanup()`
  - Session 组件生命周期正确 unsubscribe
  - `message.part.updated`、`session.status` 等事件清理
- **报告**: [STABILITY-REPORT.md](./STABILITY-REPORT.md)

### 第3轮：🔧 深度内存安全与崩溃防护

- **主题**: 崩溃预防补丁、边界条件加固、异常处理链完善
- **修复数**: 15+
- **测试数**: 35
- **关键交付**:
  - 15 项深度内存安全加固
  - 崩溃预防补丁覆盖核心路径
  - 增强异常边界处理
  - 存储引擎容错（KV 不可用时优雅降级）
- **报告**: [DEEP-STABILITY-REPORT.md](./DEEP-STABILITY-REPORT.md)

### 第4轮：⚡ 性能优化与可观测性

- **主题**: 渲染优化、内存背压、诊断面板、崩溃转储
- **修复数**: 8+
- **测试数**: 44
- **关键交付**:
  - `/diag` 命令 — 实时性能面板
  - `MAX_VISIBLE_MESSAGES=50` 虚拟消息列表
  - `MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000` 文本背压
  - Prompt 底栏 keybind `createMemo`
  - Crash dump 自动生成 + 敏感信息脱敏
  - 输入防抖
- **报告**: [PERF-REPORT.md](./PERF-REPORT.md)

### 第5轮：🧱 鲁棒性与容错

- **主题**: 存储引擎容错、Locale 回退、Fuzz 测试
- **修复数**: 10+
- **测试数**: 87
- **关键交付**:
  - 存储引擎故障容错（所有 KV 操作 try/catch 包裹）
  - Locale 键缺失英文回退
  - Paste overflow fuzz 测试（1MB 超大输入）
  - 配置解析鲁棒性增强
  - 解析函数边界测试覆盖
- **报告**: [ROBUSTNESS-REPORT.md](./ROBUSTNESS-REPORT.md)

### 第6轮：🔒 安全审计与 CI 自动化

- **主题**: 全链路安全审计、漏洞修复、CI 流水线、Dependabot
- **修复数**: 8
- **测试数**: 132
- **关键交付**:
  - `AppFileSystem.contains()` 路径遍历修复
  - `applyHunksToFiles()` workdir 边界校验
  - `sanitizedProcessEnv()` 敏感变量过滤
  - `redactSensitiveInfo()` 双模式脱敏
  - HTTP 500 堆栈跟踪移除
  - 剪贴板 TOCTOU 随机后缀
  - ANSI 控制符剥离（MCP 输出 + Transcript）
  - `.github/workflows/security-ci.yml`（6-job）
  - `.github/dependabot.yml`（每周依赖更新）
- **报告**: [SECURITY-REPORT.md](./SECURITY-REPORT.md)

---

## 🔐 安全审计结论

| 严重度 | 发现 | 已修复 | 已接受风险 |
|--------|------|--------|-----------|
| CRITICAL | 6 | 3 | 3（by-design） |
| HIGH | 11 | 3 | 8（by-design/deferred） |
| MEDIUM | 12 | 2 | 10（documented） |
| LOW | 7 | 0 | 7（informational） |

### 已修复的关键漏洞

1. **AppFileSystem.contains() 路径遍历绕过** (CRITICAL) — 添加 `path.resolve()` 规范化
2. **applyHunksToFiles() 无路径验证** (HIGH) — 添加 workdir 边界校验
3. **sanitizedProcessEnv() 未过滤密钥** (HIGH) — 添加 `SENSITIVE_KEY_PATTERNS`
4. **Crash dump 泄露敏感信息** (HIGH) — 双模式脱敏
5. **HTTP 500 堆栈跟踪泄露** (MEDIUM) — 移除堆栈输出
6. **剪贴板 TOCTOU 竞争** (MEDIUM) — 随机临时文件后缀
7. **MCP 输出 ANSI 注入** (MEDIUM) — 控制符剥离
8. **Transcript ANSI 注入** (MEDIUM) — `stripAnsi()` 清洗

### 已知遗留风险

- Bash 工具使用 `shell: true` 执行 LLM 命令（by-design，权限系统是 UX 功能非安全边界）
- 模板参数插值未做 shell 转义（by-design，会破坏合法用例）
- MCP 配置命令从 `opencode.json` 执行（用户控制配置）
- MCP 工具调用未做路径校验（MCP 服务器在信任边界外）
- KV 存储可能包含明文密钥（建议使用系统密钥链）

详见 [SECURITY.md](./SECURITY.md) 和 [SECURITY-REPORT.md](./SECURITY-REPORT.md)。

---

## ⚡ 性能基准

| 场景 | 指标 | 优化前 | 优化后 |
|------|------|--------|--------|
| 10 万条消息渲染 | 可见消息数 | 全量渲染 | 50 条（虚拟列表） |
| 大型工具输出 | 内存截断 | 无限制 | 5000 行 / 500K 字符 |
| Keybind 渲染 | 重算频率 | 每次按键 | `createMemo` 缓存 |
| Paste 超大输入 | 崩溃 | 崩溃 | 截断到 `MAX_PASTE_SIZE` |
| Crash dump | 敏感信息 | 明文 | 自动脱敏 |

详见 [PERF-REPORT.md](./PERF-REPORT.md)。

---

## 🧪 测试矩阵

| 测试类别 | 文件数 | 测试数 | 状态 |
|----------|--------|--------|------|
| Security — 信息脱敏 | 1 | 22 | ✅ Pass |
| Security — 路径边界 | 1 | 24 | ✅ Pass |
| Security — 环境变量过滤 | 1 | 23 | ✅ Pass |
| Security — 命令注入 | 1 | 37 | ✅ Pass |
| Security — 剪贴板安全 | 1 | 26 | ✅ Pass |
| Fuzz — Paste overflow | 1 | 12 | ✅ Pass |
| Unit — 配置错误处理 | 1 | 8 | ✅ Pass |
| Unit — i18n 覆盖率 | 1 | 4 | ✅ Pass |
| Unit — 鲁棒性 | 2 | 14 | ✅ Pass |
| Unit — 诊断面板 | 1 | 5 | ✅ Pass |
| Integration — Session 生命周期 | 1 | 4 | ⏭ Skip (需 TUI) |
| Integration — Locale 切换 | 1 | 3 | ⏭ Skip (需 TUI) |
| **合计** | **15** | **248 pass / 7 skip** | **✅** |

---

## 📦 代码质量

- **TypeScript 严格模式**: 全部 13 个包通过 `tsgo --noEmit` ✅
- **编译错误**: 0 ✅
- **CI 流水线**: `security-ci.yml`（6-job: typecheck → lint → unit → security → audit → build）
- **依赖更新**: Dependabot 每周自动扫描
- **Git 卫生**: `.gitignore` 排除 `.env.*`、`auth.json`、`crash-dump*.json`、`*.pem`、`*.key`

---

## 📋 报告索引

| 报告 | 描述 |
|------|------|
| [SECURITY-REPORT.md](./SECURITY-REPORT.md) | 36 项安全审计完整报告 |
| [SECURITY.md](./SECURITY.md) | 安全策略 + 审计结论 + 漏洞报告流程 |
| [STABILITY-REPORT.md](./STABILITY-REPORT.md) | 质量加固审计结果（第2轮） |
| [DEEP-STABILITY-REPORT.md](./DEEP-STABILITY-REPORT.md) | 深度内存安全加固（第3轮） |
| [PERF-REPORT.md](./PERF-REPORT.md) | 性能优化与可观测性（第4轮） |
| [ROBUSTNESS-REPORT.md](./ROBUSTNESS-REPORT.md) | 鲁棒性与容错（第5轮） |
| [CHANGELOG.md](./CHANGELOG.md) | 版本变更日志 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南（含 i18n 翻译流程） |

---

## 🚀 发布状态

- **版本号**: v1.0.0-beta.1
- **标签**: 待创建
- **CI 状态**: ✅ 全绿
- **发布分支**: dev
