<p align="center">
  <a href="https://gitee.com/xusuai/opencode-cn">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode-CN logo">
    </picture>
  </a>
</p>
<p align="center">开源的 AI Coding Agent · 中国区定制版</p>
<p align="center">
  <a href="https://gitee.com/xusuai/opencode-cn/releases"><img alt="Release" src="https://img.shields.io/badge/release-v1.14.21--CN-blue?style=flat-square" /></a>
  <img alt="Tests" src="https://img.shields.io/badge/tests-282%20pass-brightgreen?style=flat-square" />
  <img alt="Security" src="https://img.shields.io/badge/security-132%20tests-blue?style=flat-square" />
  <img alt="Hardening" src="https://img.shields.io/badge/hardened-8%20rounds-orange?style=flat-square" />
  <img alt="IME" src="https://img.shields.io/badge/IME-Chinese%20Input%20%E2%9C%93-brightgreen?style=flat-square" />
  <img alt="i18n" src="https://img.shields.io/badge/i18n-634%2B%20keys-green?style=flat-square" />
</p>

<p align="center">
  <a href="README.md">简体中文</a> |
  <a href="README.en.md">English</a>
</p>

[![OpenCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://gitee.com/xusuai/opencode-cn)

---

## 🚀 快速安装

### 二进制发行版（推荐）

从 [Releases](https://gitee.com/xusuai/opencode-cn/releases) 下载对应平台的预编译二进制文件：

| 平台 | 架构 | 文件名 | 说明 |
|------|------|--------|------|
| Linux | x86_64 | `opencode-linux-x64.tar.gz` | 主流服务器/桌面（需 AVX2） |
| Linux | x86_64 | `opencode-linux-x64-baseline.tar.gz` | 无 AVX2 的旧 CPU |
| Linux | ARM64 | `opencode-linux-arm64.tar.gz` | 树莓派/ARM 服务器 |
| Linux | x86_64 (musl) | `opencode-linux-x64-musl.tar.gz` | Alpine Linux（需 AVX2） |
| Linux | x86_64 (musl) | `opencode-linux-x64-musl-baseline.tar.gz` | Alpine Linux 无 AVX2 |
| Linux | ARM64 (musl) | `opencode-linux-arm64-musl.tar.gz` | Alpine ARM |
| macOS | Apple Silicon | `opencode-darwin-arm64.zip` | M1/M2/M3/M4 |
| macOS | Intel | `opencode-darwin-x64.zip` | Intel Mac（需 AVX2） |
| macOS | Intel | `opencode-darwin-x64-baseline.zip` | 旧 Intel Mac |
| Windows | ARM64 | `opencode-windows-arm64.zip` | ARM Windows |
| Windows | x86_64 | `opencode-windows-x64.zip` | 64位 Windows（需 AVX2） |
| Windows | x86_64 | `opencode-windows-x64-baseline.zip` | 无 AVX2 的 Windows |

> 💡 **如何判断是否需要 AVX2？** 2015年后的 x86 CPU 基本都支持。不确定就选 `baseline` 版本。

```bash
# Linux / macOS 示例
tar xzf opencode-linux-x64.tar.gz
chmod +x opencode
sudo mv opencode /usr/local/bin/

# Windows
# 解压 opencode-windows-x64.zip，将 opencode.exe 放入 PATH 目录
```

### Web 部署模式

OpenCode-CN 支持 Web 服务模式，可远程通过浏览器访问：

```bash
# 启动 Web 服务
opencode serve --port 8090 --hostname 0.0.0.0

# 访问 http://your-server:8090
```

### 从源码运行

```bash
# 克隆仓库
git clone https://gitee.com/xusuai/opencode-cn.git
cd opencode-cn

# 安装依赖（需要 Bun 1.3+）
bun install

# 开发模式
bun run --cwd packages/opencode dev

# Web 服务模式
bun run --cwd packages/opencode src/index.ts serve --port 8090 --hostname 0.0.0.0
```

---

## ✨ 中国区定制特性

### 🌐 完整中文化 (i18n)

OpenCode TUI 支持**中英文一键切换**：

- **634+ 翻译键**覆盖所有 TUI 元素 — 命令面板、状态栏、对话框、提示、帮助、错误信息
- 输入 `/locale zh` 切换中文，`/locale en` 切换英文 — **无需重启**
- 缺失键自动回退英文，防止空白界面

### 🀄 中文输入法 (IME) 支持

OpenCode 是**首个支持中文 (CJK) 输入法的终端 AI Coding Agent**：

- **根因发现**：opentui 的 `createCliRenderer` 对 `useKittyKeyboard` 使用 `null ?? {}`，设置 `null` 反而**启用** Kitty 协议 — 将所有按键编码为 CSI 转义序列，绕过 IME 组合
- **修复**：创建后显式调用 `renderer.disableKittyKeyboard()`，发送 `\x1b[>1u` 禁用 Kitty 协议并重置 stdin 解析器
- **环境**：自动检测 IBus / Fcitx5；配合 `GTK_IM_MODULE=ibus` / `XMODIFIERS=@im=ibus` 开箱即用
- **结果**：完整中文拼音输入 + 候选选择，在 gnome-terminal、WezTerm 等 IME 感知终端中完美运行

### 🔧 火山方舟等国产模型适配

已修复 `eager_input_streaming` 兼容性问题，可正常使用火山方舟 (ARK)、GLM 等国产模型提供商。

---

## 🔒 安全加固

五轮安全审计和加固，**132 项专项安全测试**：

- **路径穿越防护** — `AppFileSystem.contains()` 先解析规范化路径再比较
- **环境变量净化** — 子进程不再继承敏感密钥（`*_API_KEY`、`*_TOKEN`、`NODE_OPTIONS`、`LD_PRELOAD` 等）
- **敏感信息脱敏** — `redactSensitiveInfo()` 从崩溃转储和错误日志中剥离 API Key、Token 和密码
- **ANSI 注入防御** — MCP 工具输出渲染前剥离控制字符
- **剪贴板 TOCTOU 修复** — 临时剪贴板文件使用加密随机后缀
- **HTTP 错误安全** — 500 响应不再暴露堆栈跟踪

详见 [SECURITY-REPORT.md](./SECURITY-REPORT.md)。

---

## ⚡ 性能与诊断

- **`/diag` 命令** — 实时性能面板，显示渲染统计、内存使用、事件循环健康
- **虚拟消息列表** — `MAX_VISIBLE_MESSAGES=50` 智能截断，支持 10万+ 消息会话
- **文本背压** — `MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000` 防止大型工具输出导致内存飙升
- **崩溃转储** — 未捕获错误自动转储，敏感信息已脱敏
- **输入防抖** — 按键防抖避免不必要的重渲染

详见 [PERF-REPORT.md](./PERF-REPORT.md)。

---

## 🛡️ 稳定性

- **事件泄漏修复** — 11 个 `event.on()` 监听器使用 `onCleanup()` 修复，防止重复挂载/卸载时内存泄漏
- **深度内存安全** — 15 个额外的防崩溃加固补丁
- **存储引擎容错** — KV 存储不可用时优雅降级
- **语言回退** — 缺失 i18n 键回退英文而非显示空白

详见 [STABILITY-REPORT.md](./STABILITY-REPORT.md)。

---

## 🏆 八轮加固 · 生产级质量

| 轮次 | 主题 | 修复数 | 测试数 |
|------|------|--------|--------|
| 1 | 🌐 i18n 中文本地化 | 15+ | 28 |
| 2 | 🛡️ 事件泄漏 & 内存安全 | 11+ | 22 |
| 3 | 🔧 深度内存 & 防崩溃 | 15+ | 35 |
| 4 | ⚡ 性能 & 可观测性 | 8+ | 44 |
| 5 | 🧱 鲁棒性 & 容错 | 10+ | 87 |
| 6 | 🔒 安全审计 & CI | 8 | 132 |
| 7 | 🀄 IME 修复 + 禁用自动更新 | 3 | 282 |
| 8 | 🚀 发布加固 & 二进制 | 5+ | 282 |

**关键指标：** 70+ 修复 · 282 测试全通过 · 0 类型错误 · 36项安全审计（8个严重/高危已修复）· **中文输入法可用** ✓

详见 [PROJECT-STATUS.md](./PROJECT-STATUS.md)。

---

## 🤖 内置 Agent

按 `Tab` 键切换两种内置 Agent：

- **build** — 默认，全权限开发 Agent
- **plan** — 只读 Agent，用于分析和代码探索
  - 默认拒绝文件编辑
  - 运行 bash 命令前请求许可
  - 适合探索陌生代码库或规划变更

另有 **general** 子 Agent 用于复杂搜索和多步骤任务，可在消息中用 `@general` 调用。

---

## 📋 TUI 命令

| 命令 | 说明 |
|------|------|
| `/locale zh` | 切换中文界面 |
| `/locale en` | 切换英文界面 |
| `/diag` | 打开诊断面板 |
| `/compact` | 压缩对话历史 |
| `/clear` | 清除当前会话 |
| `/theme <名称>` | 切换颜色主题 |
| `/share` | 通过 URL 分享会话 |
| `Tab` | 切换 build/plan Agent |
| `F9` | 打开工具对话框 |
| `?` | 显示帮助 |

---

## 🔌 MCP 工具集成

支持 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 扩展 Agent 能力：

- 在 `opencode.json` 中配置 MCP 服务器
- 自动发现和工具注册
- 权限管控执行

---

## 📖 文档

更多配置信息请参阅 [OpenCode 文档](https://gitee.com/xusuai/opencode-cn)。

## 🤝 贡献

欢迎贡献！请先阅读 [贡献指南](./CONTRIBUTING.md)。

## 📄 许可证

本项目基于上游 [OpenCode](https://github.com/anomalyco/opencode) (MIT License) 进行中国区定制。

---

**社区** [Discord](https://discord.gg/opencode) | [X.com](https://x.com/opencode) | [Gitee](https://gitee.com/xusuai/opencode-cn)
