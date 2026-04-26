<p align="center">
  <a href="https://gitee.com/xusuai/opencode-cn">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode logo">
    </picture>
  </a>
</p>
<p align="center">开源的 AI Coding Agent。</p>
<p align="center">
  <a href="https://opencode.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/opencode-ai"><img alt="npm" src="https://img.shields.io/npm/v/opencode-ai?style=flat-square" /></a>
  <a href="https://github.com/anomalyco/opencode/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/badge/release-v1.0.0--CN-blue?style=flat-square" /></a>
  <img alt="Tests" src="https://img.shields.io/badge/tests-248%20pass-brightgreen?style=flat-square" />
  <img alt="Security" src="https://img.shields.io/badge/security-132%20tests-blue?style=flat-square" />
  <img alt="Hardening" src="https://img.shields.io/badge/hardened-8%20rounds-orange?style=flat-square" />
  <img alt="IME" src="https://img.shields.io/badge/IME-%E4%B8%AD%E6%96%87%E8%BE%93%E5%85%A5%E6%B3%95%20%E2%9C%93-brightgreen?style=flat-square" />
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![OpenCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://gitee.com/xusuai/opencode-cn)

---

### 安装

```bash
# 直接安装 (YOLO)
curl -fsSL https://opencode.ai/install | bash

# 软件包管理器
npm i -g opencode-ai@latest        # 也可使用 bun/pnpm/yarn
scoop install opencode             # Windows
choco install opencode             # Windows
brew install anomalyco/tap/opencode # macOS 和 Linux（推荐，始终保持最新）
brew install opencode              # macOS 和 Linux（官方 brew formula，更新频率较低）
sudo pacman -S opencode            # Arch Linux (Stable)
paru -S opencode-bin               # Arch Linux (Latest from AUR)
mise use -g opencode               # 任意系统
nix run nixpkgs#opencode           # 或用 github:anomalyco/opencode 获取最新 dev 分支
```

> [!TIP]
> 安装前请先移除 0.1.x 之前的旧版本。

### 桌面应用程序 (BETA)

OpenCode 也提供桌面版应用。可直接从 [Gitee 发布页](https://gitee.com/xusuai/opencode-cn/releases) 下载。

| 平台                  | 下载文件                              |
| --------------------- | ------------------------------------- |
| macOS (Apple Silicon) | `opencode-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `opencode-desktop-darwin-x64.dmg`     |
| Windows               | `opencode-desktop-windows-x64.exe`    |
| Linux                 | `.deb`、`.rpm` 或 AppImage            |

```bash
# macOS (Homebrew Cask)
brew install --cask opencode-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/opencode-desktop
```

#### 安装目录

安装脚本按照以下优先级决定安装路径：

1. `$OPENCODE_INSTALL_DIR` - 自定义安装目录
2. `$XDG_BIN_DIR` - 符合 XDG 基础目录规范的路径
3. `$HOME/bin` - 如果存在或可创建的用户二进制目录
4. `$HOME/.opencode/bin` - 默认备用路径

```bash
# 示例
OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://opencode.ai/install | bash
```

---

### 核心特性

#### 🌐 国际化 (i18n)

OpenCode TUI 支持**中英文一键切换**：

- **634+ 翻译键**，覆盖所有 TUI 元素——命令面板、状态栏、对话框、提示、帮助、错误信息
- 输入 `/locale zh` 切换中文，`/locale en` 切换英文——**无需重启**
- 缺失键自动回退英文，防止界面空白
- 语言包位置：`packages/opencode/src/cli/cmd/tui/i18n/en.ts` 和 `zh.ts`

> **TODO：** 中英文界面对比截图

#### 🀄 中文输入法（IME）支持 — 终端 AI Agent 首创

OpenCode 是**首个在终端 TUI 中原生支持中文（CJK）输入法**的 AI 编程助手：

- **根因发现**：opentui 的 `createCliRenderer` 内部对 `useKittyKeyboard` 执行 `null ?? {}`，设 `null` 反而**启用**了 Kitty 协议 — 将所有按键编码为 CSI 转义序列，完全绕过 IME 组合
- **修复方案**：在创建 Renderer 后显式调用 `renderer.disableKittyKeyboard()`，发送 `\x1b[>1u` 关闭 Kitty 协议并重置 stdin 解析器
- **环境适配**：自动检测 IBus / Fcitx5，配合 `GTK_IM_MODULE=ibus` / `XMODIFIERS=@im=ibus` 即可开箱即用
- **实际效果**：在 gnome-terminal、WezTerm 等 IME-aware 终端中，中文拼音输入及候选词选择完美运行

> 这曾被业界视为终端 TUI 的**不可解难题** — raw mode 与 IME 的经典冲突。OpenCode 通过精确控制 Kitty 键盘协议生命周期，彻底解决了这一问题。

#### 🔒 安全加固

经过五轮安全审计和加固，配备 **132 项专项安全测试**：

- **路径遍历防护** — `AppFileSystem.contains()` 在比较前先 resolve + normalize 路径
- **环境变量过滤** — 子进程不再继承敏感变量（`*_API_KEY`、`*_TOKEN`、`NODE_OPTIONS`、`LD_PRELOAD` 等）
- **敏感信息脱敏** — `redactSensitiveInfo()` 从崩溃转储和错误日志中移除 API Key、Token、密码
- **ANSI 注入防御** — MCP 工具输出在渲染前剥离控制字符
- **剪贴板 TOCTOU 修复** — 临时剪贴板文件使用加密随机后缀
- **HTTP 错误安全** — 500 响应不再暴露堆栈跟踪

详见 [SECURITY-REPORT.md](./SECURITY-REPORT.md) 中的 36 项完整审计报告。

#### ⚡ 性能与诊断

- **`/diag` 命令** — 实时性能面板，展示渲染统计、内存使用、事件循环健康度
- **虚拟消息列表** — `MAX_VISIBLE_MESSAGES=50` 智能截断，支持 10 万+消息的会话
- **文本背压** — `MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000` 防止大型工具输出导致内存飙升
- **崩溃转储** — 未处理错误时自动生成崩溃转储，敏感信息已脱敏
- **输入防抖** — 按键防抖，避免不必要的重渲染

详见 [PERF-REPORT.md](./PERF-REPORT.md) 获取详细优化结果。

#### 🛡️ 稳定性

- **事件泄漏修复** — 11 处 `event.on()` 修复为 `onCleanup()`，防止反复挂载/卸载时的内存泄漏
- **深度内存安全** — 15 项额外加固补丁防止崩溃
- **存储引擎容错** — KV 存储不可用时优雅降级
- **语言包回退** — 缺失 i18n 键回退英文，不再显示空白文本

详见 [STABILITY-REPORT.md](./STABILITY-REPORT.md) 获取完整报告。

#### 🔌 MCP 工具集成

OpenCode 支持 [模型上下文协议 (MCP)](https://modelcontextprotocol.io/)，可扩展 Agent 的自定义工具：

- 在 `opencode.json` 中配置 MCP 服务器
- 自动发现和工具注册
- 经用户许可的权限门控执行

---

### Agents

OpenCode 内置两种 Agent，可用 `Tab` 键快速切换：

- **build** - 默认模式，具备完整权限，适合开发工作
- **plan** - 只读模式，适合代码分析与探索
  - 默认拒绝修改文件
  - 运行 bash 命令前会询问
  - 便于探索未知代码库或规划改动

另外还包含一个 **general** 子 Agent，用于复杂搜索和多步任务，内部使用，也可在消息中输入 `@general` 调用。

了解更多 [Agents](https://gitee.com/xusuai/opencode-cn) 相关信息。

### TUI 命令

| 命令 | 说明 |
|------|------|
| `/locale zh` | 切换为中文界面 |
| `/locale en` | 切换为英文界面 |
| `/diag` | 打开诊断面板 |
| `/compact` | 压缩对话历史 |
| `/clear` | 清空当前会话 |
| `/theme <名称>` | 切换颜色主题 |
| `/share` | 通过 URL 分享会话 |
| `Tab` | 切换 build/plan Agent |
| `F9` | 打开工具对话框 |
| `?` | 显示帮助 |

### 文档

更多配置说明请查看我们的 [**官方文档**](https://gitee.com/xusuai/opencode-cn)。

### 参与贡献

如有兴趣贡献代码，请在提交 PR 前阅读 [贡献指南 (Contributing Docs)](./CONTRIBUTING.md)。

### 基于 OpenCode 进行开发

如果你在项目名中使用了 "opencode"（如 "opencode-dashboard" 或 "opencode-mobile"），请在 README 里注明该项目不是 OpenCode 团队官方开发，且不存在隶属关系。

### 🏆 工业级稳定性 — 八轮系统性加固

OpenCode 经历了 **八轮系统性加固**，达到工业级质量水准：

| 轮次 | 主题 | 修复数 | 测试数 |
|------|------|--------|--------|
| 1 | 🌐 i18n 中文本地化 | 15+ | 28 |
| 2 | 🛡️ 事件泄漏与内存安全 | 11+ | 22 |
| 3 | 🔧 深度内存安全与崩溃防护 | 15+ | 35 |
| 4 | ⚡ 性能优化与可观测性 | 8+ | 44 |
| 5 | 🧱 鲁棒性与容错 | 10+ | 87 |
| 6 | 🔒 安全审计与 CI 自动化 | 8 | 132 |
| 7 | 🀄 中文输入法修复 + 禁用自动更新 | 3 | 282 |
| 8 | 🚀 发布加固与二进制交付 | 5+ | 282 |

**核心指标**: 70+ 修复 · 282 测试全通过 · 0 编译错误 · 36 项安全审计（8 项高危已修复）· **中文输入法可用** ✓

详见 [PROJECT-STATUS.md](./PROJECT-STATUS.md) 质量仪表板。

### 常见问题 (FAQ)

#### 这和 Claude Code 有什么不同？

功能上很相似，关键差异：

- 100% 开源。
- 不绑定特定提供商。OpenCode 可搭配 Claude、OpenAI、Google 甚至本地模型使用。模型迭代会缩小差异、降低成本，因此保持 provider-agnostic 很重要。
- 内置 LSP 支持。
- 聚焦终端界面 (TUI)。OpenCode 由 Neovim 爱好者和 [terminal.shop](https://terminal.shop) 的创建者打造，会持续探索终端的极限。
- 客户端/服务器架构。可在本机运行，同时用移动设备远程驱动。TUI 只是众多潜在客户端之一。

---

**加入我们的社区** [Discord](https://discord.gg/opencode) | [X.com](https://x.com/opencode)
