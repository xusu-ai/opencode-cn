# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.1] - 2026-04-25

### Features

#### i18n 国际化
- **TUI 全量中文本地化** — 634+ 翻译键覆盖所有 TUI 元素（命令面板、状态栏、对话框、提示、帮助、错误信息）
- **`/locale zh` / `/locale en` 一键切换** — 无需重启，即时生效
- **自动回退机制** — 缺失 i18n 键自动回退英文，防止界面空白
- **自测自修流水线** — 静态检查 + 3 套 bun:test 单元测试 + 自动修复调度器
- **类型安全的语言包** — `Dictionary` 类型约束确保翻译键完整性

#### 诊断面板
- **`/diag` 命令** — 实时性能面板：渲染统计、内存使用、事件循环健康度
- **Crash dump 自动生成** — 未处理错误时自动写入崩溃转储文件，敏感信息已脱敏

### Security

#### 路径遍历防护
- **`AppFileSystem.contains()` 修复** — 添加 `path.resolve()` 规范化，防止 `..` 路径绕过沙盒边界
- **`applyHunksToFiles()` 路径验证** — workdir 边界校验 + resolvedPath 限定项目目录

#### 敏感信息保护
- **`sanitizedProcessEnv()` 真正过滤** — 子进程不再继承 `*_API_KEY`、`*_TOKEN`、`NODE_OPTIONS`、`LD_PRELOAD` 等敏感变量
- **`redactSensitiveInfo()` 双模式脱敏** — crash dump 和错误日志中自动移除 API Key、Token、密码
- **HTTP 500 无堆栈泄露** — 服务器错误响应不再暴露堆栈跟踪

#### 注入防御
- **ANSI 控制符剥离** — MCP 工具输出渲染前自动清洗 ANSI 注入字符
- **剪贴板 TOCTOU 修复** — 临时剪贴板文件使用加密随机后缀，防止符号链接竞争

#### 安全测试体系
- **132 项安全专项测试** — 覆盖路径遍历、命令注入、环境变量过滤、信息脱敏、剪贴板安全
- **5 个测试文件** — `security-redaction.test.ts`、`path-boundary.test.ts`、`env-sanitization.test.ts`、`command-injection.test.ts`、`clipboard-security.test.ts`
- **CI 安全扫描** — `.github/workflows/security-ci.yml` 6-job 流水线 + `dependabot.yml` 每周依赖更新

### Performance

#### 渲染优化
- **Prompt 底栏 keybind 列表 `createMemo`** — 避免每次按键重算
- **Session 消息列表 `createMemo` + `MAX_VISIBLE_MESSAGES=50`** — 10 万条消息时只渲染最近 50 条
- **Tool output `limited` memo** — 工具输出始终只渲染 3 行（可展开）

#### 内存背压
- **`MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000`** — 防止大型工具输出导致内存飙升
- **输入防抖** — 按键防抖避免不必要的重渲染

### Bug Fixes

#### 稳定性修复
- **11 处 `event.on()` 泄漏修复** — 全部包裹 `onCleanup()`，防止反复挂载/卸载时监听器累积
- **15 项深度内存安全加固** — 崩溃预防补丁
- **存储引擎容错** — KV 存储不可用时优雅降级
- **Session 组件生命周期清理** — `message.part.updated`、`session.status` 等事件正确 unsubscribe

### Documentation

- **SECURITY-REPORT.md** — 36 项安全审计完整报告（8 项已修复，28 项已知/接受风险）
- **STABILITY-REPORT.md** — 质量加固审计结果
- **PERF-REPORT.md** — 性能优化与可观测性提升报告
- **README.md / README.zh.md** — 重构为中英双语，补充 i18n、安全、性能、诊断面板特性
- **CONTRIBUTING.md** — 添加 i18n 翻译贡献流程、CI 流水线说明

---

## [1.14.21] - 2025-04-24

### Upstream Changes
- Sync release versions for v1.14.21
- Various upstream bug fixes and improvements (see upstream changelog)

---

## [1.14.20] - 2025-04-23

### Upstream Changes
- Sync release versions for v1.14.20
- fix(opencode): rescrict github copilot opus 4.7 variants to "medium"
- fix: conditionally show file tree in beta channel

---

[Historical upstream releases follow the original opencode changelog at https://github.com/anomalyco/opencode/releases]
