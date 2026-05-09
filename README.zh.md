     1|<p align="center">
     2|  <a href="https://github.com/xusu-ai/opencode-cn">
     3|    <picture>
     4|      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
     5|      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
     6|      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode-CN logo">
     7|    </picture>
     8|  </a>
     9|</p>
    10|<p align="center">开源的 AI Coding Agent · 中国区定制版</p>
    11|<p align="center">
    12|  <a href="https://github.com/xusu-ai/opencode-cn/releases"><img alt="Release" src="https://img.shields.io/badge/release-v1.14.21--CN-blue?style=flat-square" /></a>
    13|  <img alt="Tests" src="https://img.shields.io/badge/tests-282%20pass-brightgreen?style=flat-square" />
    14|  <img alt="Security" src="https://img.shields.io/badge/security-132%20tests-blue?style=flat-square" />
    15|  <img alt="Hardening" src="https://img.shields.io/badge/hardened-8%20rounds-orange?style=flat-square" />
    16|  <img alt="IME" src="https://img.shields.io/badge/IME-Chinese%20Input%20%E2%9C%93-brightgreen?style=flat-square" />
    17|  <img alt="i18n" src="https://img.shields.io/badge/i18n-634%2B%20keys-green?style=flat-square" />
    18|</p>
    19|
    20|<p align="center">
    21|  <a href="README.md">简体中文</a> |
    22|  <a href="README.en.md">English</a>
    23|</p>
    24|
    25|[![OpenCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/xusu-ai/opencode-cn)
    26|
    27|---
    28|
    29|## 🚀 快速安装
    30|
    31|### 二进制发行版（推荐）
    32|
    33|从 [Releases](https://github.com/xusu-ai/opencode-cn/releases) 下载对应平台的预编译二进制文件：
    34|
    35|| 平台 | 架构 | 文件名 | 说明 |
    36||------|------|--------|------|
    37|| Linux | x86_64 | `opencode-linux-x64.tar.gz` | 主流服务器/桌面（需 AVX2） |
    38|| Linux | x86_64 | `opencode-linux-x64-baseline.tar.gz` | 无 AVX2 的旧 CPU |
    39|| Linux | ARM64 | `opencode-linux-arm64.tar.gz` | 树莓派/ARM 服务器 |
    40|| Linux | x86_64 (musl) | `opencode-linux-x64-musl.tar.gz` | Alpine Linux（需 AVX2） |
    41|| Linux | x86_64 (musl) | `opencode-linux-x64-musl-baseline.tar.gz` | Alpine Linux 无 AVX2 |
    42|| Linux | ARM64 (musl) | `opencode-linux-arm64-musl.tar.gz` | Alpine ARM |
    43|| macOS | Apple Silicon | `opencode-darwin-arm64.zip` | M1/M2/M3/M4 |
    44|| macOS | Intel | `opencode-darwin-x64.zip` | Intel Mac（需 AVX2） |
    45|| macOS | Intel | `opencode-darwin-x64-baseline.zip` | 旧 Intel Mac |
    46|| Windows | ARM64 | `opencode-windows-arm64.zip` | ARM Windows |
    47|| Windows | x86_64 | `opencode-windows-x64.zip` | 64位 Windows（需 AVX2） |
    48|| Windows | x86_64 | `opencode-windows-x64-baseline.zip` | 无 AVX2 的 Windows |
    49|
    50|> 💡 **如何判断是否需要 AVX2？** 2015年后的 x86 CPU 基本都支持。不确定就选 `baseline` 版本。
    51|
    52|```bash
    53|# Linux / macOS 示例
    54|tar xzf opencode-linux-x64.tar.gz
    55|chmod +x opencode
    56|sudo mv opencode /usr/local/bin/
    57|
    58|# Windows
    59|# 解压 opencode-windows-x64.zip，将 opencode.exe 放入 PATH 目录
    60|```
    61|
    62|### Web 部署模式
    63|
    64|OpenCode-CN 支持 Web 服务模式，可远程通过浏览器访问：
    65|
    66|```bash
    67|# 启动 Web 服务
    68|opencode serve --port 8090 --hostname 0.0.0.0
    69|
    70|# 访问 http://your-server:8090
    71|```
    72|
    73|### 从源码运行
    74|
    75|```bash
    76|# 克隆仓库
    77|git clone https://github.com/xusu-ai/opencode-cn.git
    78|cd opencode-cn
    79|
    80|# 安装依赖（需要 Bun 1.3+）
    81|bun install
    82|
    83|# 开发模式
    84|bun run --cwd packages/opencode dev
    85|
    86|# Web 服务模式
    87|bun run --cwd packages/opencode src/index.ts serve --port 8090 --hostname 0.0.0.0
    88|```
    89|
    90|---
    91|
    92|## ✨ 中国区定制特性
    93|
    94|### 🌐 完整中文化 (i18n)
    95|
    96|OpenCode TUI 支持**中英文一键切换**：
    97|
    98|- **634+ 翻译键**覆盖所有 TUI 元素 — 命令面板、状态栏、对话框、提示、帮助、错误信息
    99|- 输入 `/locale zh` 切换中文，`/locale en` 切换英文 — **无需重启**
   100|- 缺失键自动回退英文，防止空白界面
   101|
   102|### 🀄 中文输入法 (IME) 支持
   103|
   104|OpenCode 是**首个支持中文 (CJK) 输入法的终端 AI Coding Agent**：
   105|
   106|- **根因发现**：opentui 的 `createCliRenderer` 对 `useKittyKeyboard` 使用 `null ?? {}`，设置 `null` 反而**启用** Kitty 协议 — 将所有按键编码为 CSI 转义序列，绕过 IME 组合
   107|- **修复**：创建后显式调用 `renderer.disableKittyKeyboard()`，发送 `\x1b[>1u` 禁用 Kitty 协议并重置 stdin 解析器
   108|- **环境**：自动检测 IBus / Fcitx5；配合 `GTK_IM_MODULE=ibus` / `XMODIFIERS=@im=ibus` 开箱即用
   109|- **结果**：完整中文拼音输入 + 候选选择，在 gnome-terminal、WezTerm 等 IME 感知终端中完美运行
   110|
   111|### 🔧 火山方舟等国产模型适配
   112|
   113|已修复 `eager_input_streaming` 兼容性问题，可正常使用火山方舟 (ARK)、GLM 等国产模型提供商。
   114|
   115|---
   116|
   117|## 🔒 安全加固
   118|
   119|五轮安全审计和加固，**132 项专项安全测试**：
   120|
   121|- **路径穿越防护** — `AppFileSystem.contains()` 先解析规范化路径再比较
   122|- **环境变量净化** — 子进程不再继承敏感密钥（`*_API_KEY`、`*_TOKEN`、`NODE_OPTIONS`、`LD_PRELOAD` 等）
   123|- **敏感信息脱敏** — `redactSensitiveInfo()` 从崩溃转储和错误日志中剥离 API Key、Token 和密码
   124|- **ANSI 注入防御** — MCP 工具输出渲染前剥离控制字符
   125|- **剪贴板 TOCTOU 修复** — 临时剪贴板文件使用加密随机后缀
   126|- **HTTP 错误安全** — 500 响应不再暴露堆栈跟踪
   127|
   128|详见 [SECURITY-REPORT.md](./SECURITY-REPORT.md)。
   129|
   130|---
   131|
   132|## ⚡ 性能与诊断
   133|
   134|- **`/diag` 命令** — 实时性能面板，显示渲染统计、内存使用、事件循环健康
   135|- **虚拟消息列表** — `MAX_VISIBLE_MESSAGES=50` 智能截断，支持 10万+ 消息会话
   136|- **文本背压** — `MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000` 防止大型工具输出导致内存飙升
   137|- **崩溃转储** — 未捕获错误自动转储，敏感信息已脱敏
   138|- **输入防抖** — 按键防抖避免不必要的重渲染
   139|
   140|详见 [PERF-REPORT.md](./PERF-REPORT.md)。
   141|
   142|---
   143|
   144|## 🛡️ 稳定性
   145|
   146|- **事件泄漏修复** — 11 个 `event.on()` 监听器使用 `onCleanup()` 修复，防止重复挂载/卸载时内存泄漏
   147|- **深度内存安全** — 15 个额外的防崩溃加固补丁
   148|- **存储引擎容错** — KV 存储不可用时优雅降级
   149|- **语言回退** — 缺失 i18n 键回退英文而非显示空白
   150|
   151|详见 [STABILITY-REPORT.md](./STABILITY-REPORT.md)。
   152|
   153|---
   154|
   155|## 🏆 八轮加固 · 生产级质量
   156|
   157|| 轮次 | 主题 | 修复数 | 测试数 |
   158||------|------|--------|--------|
   159|| 1 | 🌐 i18n 中文本地化 | 15+ | 28 |
   160|| 2 | 🛡️ 事件泄漏 & 内存安全 | 11+ | 22 |
   161|| 3 | 🔧 深度内存 & 防崩溃 | 15+ | 35 |
   162|| 4 | ⚡ 性能 & 可观测性 | 8+ | 44 |
   163|| 5 | 🧱 鲁棒性 & 容错 | 10+ | 87 |
   164|| 6 | 🔒 安全审计 & CI | 8 | 132 |
   165|| 7 | 🀄 IME 修复 + 禁用自动更新 | 3 | 282 |
   166|| 8 | 🚀 发布加固 & 二进制 | 5+ | 282 |
   167|
   168|**关键指标：** 70+ 修复 · 282 测试全通过 · 0 类型错误 · 36项安全审计（8个严重/高危已修复）· **中文输入法可用** ✓
   169|
   170|详见 [PROJECT-STATUS.md](./PROJECT-STATUS.md)。
   171|
   172|---
   173|
   174|## 🤖 内置 Agent
   175|
   176|按 `Tab` 键切换两种内置 Agent：
   177|
   178|- **build** — 默认，全权限开发 Agent
   179|- **plan** — 只读 Agent，用于分析和代码探索
   180|  - 默认拒绝文件编辑
   181|  - 运行 bash 命令前请求许可
   182|  - 适合探索陌生代码库或规划变更
   183|
   184|另有 **general** 子 Agent 用于复杂搜索和多步骤任务，可在消息中用 `@general` 调用。
   185|
   186|---
   187|
   188|## 📋 TUI 命令
   189|
   190|| 命令 | 说明 |
   191||------|------|
   192|| `/locale zh` | 切换中文界面 |
   193|| `/locale en` | 切换英文界面 |
   194|| `/diag` | 打开诊断面板 |
   195|| `/compact` | 压缩对话历史 |
   196|| `/clear` | 清除当前会话 |
   197|| `/theme <名称>` | 切换颜色主题 |
   198|| `/share` | 通过 URL 分享会话 |
   199|| `Tab` | 切换 build/plan Agent |
   200|| `F9` | 打开工具对话框 |
   201|| `?` | 显示帮助 |
   202|
   203|---
   204|
   205|## 🔌 MCP 工具集成
   206|
   207|支持 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 扩展 Agent 能力：
   208|
   209|- 在 `opencode.json` 中配置 MCP 服务器
   210|- 自动发现和工具注册
   211|- 权限管控执行
   212|
   213|---
   214|
   215|## 📖 文档
   216|
   217|更多配置信息请参阅 [OpenCode 文档](https://github.com/xusu-ai/opencode-cn)。
   218|
   219|## 🤝 贡献
   220|
   221|欢迎贡献！请先阅读 [贡献指南](./CONTRIBUTING.md)。
   222|
   223|## 📄 许可证
   224|
   225|本项目基于上游 [OpenCode](https://github.com/anomalyco/opencode) (MIT License) 进行中国区定制。
   226|
   227|---
   228|
   229|**社区** [Discord](https://discord.gg/opencode) | [X.com](https://x.com/opencode) | [Gitee](https://github.com/xusu-ai/opencode-cn)
   230|