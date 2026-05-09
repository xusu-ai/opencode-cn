<p align="center">
  <a href="https://github.com/xusu-ai/opencode-cn">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode-CN logo">
    </picture>
  </a>
</p>
<p align="center">The Open Source AI Coding Agent · China Edition</p>
<p align="center">
  <a href="https://github.com/xusu-ai/opencode-cn/releases"><img alt="Release" src="https://img.shields.io/badge/release-v1.14.21--CN-blue?style=flat-square" /></a>
  <a href="https://github.com/xusu-ai/opencode-cn/actions"><img alt="Tests" src="https://img.shields.io/badge/tests-282%20pass-brightgreen?style=flat-square" /></a>
  <img alt="Security" src="https://img.shields.io/badge/security-132%20tests-blue?style=flat-square" />
  <img alt="Hardening" src="https://img.shields.io/badge/hardened-8%20rounds-orange?style=flat-square" />
  <img alt="IME" src="https://img.shields.io/badge/IME-Chinese%20Input%20%E2%9C%93-brightgreen?style=flat-square" />
  <img alt="i18n" src="https://img.shields.io/badge/i18n-634%2B%20keys-green?style=flat-square" />
  <a href="https://gitee.com/xusuai/opencode-cn"><img alt="Gitee Mirror" src="https://img.shields.io/badge/Gitee-mirror-red?logo=gitee" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a>
</p>

[![OpenCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/xusu-ai/opencode-cn)

---

## 🚀 Quick Install

### Binary Releases (Recommended)

Download pre-compiled binaries for your platform from [Releases](https://github.com/xusu-ai/opencode-cn/releases):

| Platform | Arch | Filename | Notes |
|----------|------|----------|-------|
| Linux | x86_64 | `opencode-linux-x64.tar.gz` | Mainstream servers/desktops (AVX2 required) |
| Linux | x86_64 | `opencode-linux-x64-baseline.tar.gz` | Older CPUs without AVX2 |
| Linux | ARM64 | `opencode-linux-arm64.tar.gz` | Raspberry Pi / ARM servers |
| Linux | x86_64 (musl) | `opencode-linux-x64-musl.tar.gz` | Alpine Linux (AVX2 required) |
| Linux | x86_64 (musl) | `opencode-linux-x64-musl-baseline.tar.gz` | Alpine Linux without AVX2 |
| Linux | ARM64 (musl) | `opencode-linux-arm64-musl.tar.gz` | Alpine ARM |
| macOS | Apple Silicon | `opencode-darwin-arm64.zip` | M1/M2/M3/M4 |
| macOS | Intel | `opencode-darwin-x64.zip` | Intel Mac (AVX2 required) |
| macOS | Intel | `opencode-darwin-x64-baseline.zip` | Older Intel Macs |
| Windows | ARM64 | `opencode-windows-arm64.zip` | ARM Windows |
| Windows | x86_64 | `opencode-windows-x64.zip` | 64-bit Windows (AVX2 required) |
| Windows | x86_64 | `opencode-windows-x64-baseline.zip` | Windows without AVX2 |

> 💡 **Need AVX2?** Most x86 CPUs from 2015+ support it. When in doubt, choose the `baseline` build.

```bash
# Linux / macOS
tar xzf opencode-linux-x64.tar.gz
chmod +x opencode
sudo mv opencode /usr/local/bin/

# Windows
# Extract opencode-windows-x64.zip, place opencode.exe in a PATH directory
```

### Web Deployment Mode

OpenCode-CN supports a web server mode for remote browser access:

```bash
# Start web server
opencode serve --port 8090 --hostname 0.0.0.0

# Visit http://your-server:8090
```

### Run from Source

```bash
# Clone the repo
git clone https://github.com/xusu-ai/opencode-cn.git
cd opencode-cn

# Install dependencies (requires Bun 1.3+)
bun install

# Dev mode
bun run --cwd packages/opencode dev

# Web server mode
bun run --cwd packages/opencode src/index.ts serve --port 8090 --hostname 0.0.0.0
```

---

## ✨ China Edition Features

### 🌐 Full Chinese Localization (i18n)

OpenCode TUI supports **Chinese/English one-key switching**:

- **634+ translation keys** covering all TUI elements — command palette, status bar, dialogs, tips, help, errors
- Type `/locale zh` for Chinese, `/locale en` for English — **no restart required**
- Missing keys fall back to English automatically
- Covers: editor, terminal, git, search, files, MCP, agents, settings, diagnostics, and more

### 🀄 Chinese Input Method (IME) Support

OpenCode is the **first terminal-based AI coding agent** to support **Chinese (CJK) input methods** natively:

- **Root cause discovered**: opentui's `createCliRenderer` applies `null ?? {}` to `useKittyKeyboard`, so setting `null` actually **enables** Kitty protocol — encoding all keystrokes as CSI escape sequences that bypass IME composition
- **Fix**: Explicit `renderer.disableKittyKeyboard()` after creation, sending `\x1b[>1u` to disable Kitty protocol
- **Environment**: IBus / Fcitx5 auto-detected; works with `GTK_IM_MODULE=ibus` / `XMODIFIERS=@im=ibus`
- **Result**: Full Pinyin input with candidate selection works in gnome-terminal, WezTerm, etc.

### 🔧 Volcano Ark & Domestic Model Compatibility

Fixed `eager_input_streaming` compatibility issues for Volcano Ark (ARK), GLM, and other Chinese model providers. Seamless integration with domestic AI services.

### 📦 Cross-Platform Build Pipeline

Two build configurations for maximum compatibility:

- **AVX2 build** — Optimized for modern x86 CPUs with AVX2 support (higher performance)
- **Baseline build** — Compatible with older x86 CPUs lacking AVX2 instructions
- **ARM64 build** — For Raspberry Pi, AWS Graviton, and other ARM servers
- **musl builds** — For Alpine Linux and other musl-based distributions
- Automated GitHub Actions CI with artifact uploads

---

## 🔒 Security Hardening

Eight rounds of security hardening with **132 dedicated security tests**:

- **Path traversal protection** — `AppFileSystem.contains()` resolves and normalizes paths
- **Environment variable sanitization** — Child processes don't inherit sensitive keys
- **Sensitive info redaction** — `redactSensitiveInfo()` strips API keys from crash dumps
- **ANSI injection defense** — MCP tool output stripped of control characters
- **Clipboard TOCTOU fix** — Temp clipboard files use cryptographic random suffixes
- **HTTP error safety** — 500 responses don't expose stack traces
- **Dependency audit** — All dependencies scanned for known vulnerabilities

See [SECURITY-REPORT.md](./SECURITY-REPORT.md) for the full 36-finding audit.

---

## ⚡ Performance & Diagnostics

- **`/diag` command** — Real-time performance panel with memory, CPU, and rendering metrics
- **Virtual message list** — `MAX_VISIBLE_MESSAGES=50` with smart truncation for 100K+ message sessions
- **Text backpressure** — `MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000`
- **Crash dump** — Automatic crash dump with sensitive info redacted
- **Input debounce** — Keystroke debouncing to avoid unnecessary re-renders
- **Rendering optimization** — Targeted rendering reduces CPU usage during streaming output

See [PERF-REPORT.md](./PERF-REPORT.md) for detailed results.

---

## 🛡️ Stability

- **Event leak fixes** — 11 `event.on()` listeners fixed with `onCleanup()`
- **Deep memory safety** — 15 additional hardening patches
- **Storage engine fault tolerance** — Graceful degradation when KV store unavailable
- **Locale fallback** — Missing i18n keys fall back to English
- **Graceful shutdown** — Proper cleanup of processes on SIGTERM/SIGINT

See [STABILITY-REPORT.md](./STABILITY-REPORT.md) for the full report.

---

## 🏆 Eight Rounds of Hardening — Production Quality

| Round | Theme | Fixes | Tests |
|-------|-------|-------|-------|
| 1 | 🌐 i18n Chinese Localization | 15+ | 28 |
| 2 | 🛡️ Event Leak & Memory Safety | 11+ | 22 |
| 3 | 🔧 Deep Memory & Crash Prevention | 15+ | 35 |
| 4 | ⚡ Performance & Observability | 8+ | 44 |
| 5 | 🧱 Robustness & Fault Tolerance | 10+ | 87 |
| 6 | 🔒 Security Audit & CI | 8 | 132 |
| 7 | 🀄 IME Fix + Auto-Update Disable | 3 | 282 |
| 8 | 🚀 Release Hardening & Binary | 5+ | 282 |

**Key metrics:** 70+ fixes · 282 tests passing · 0 typecheck errors · 36-item security audit (8 critical/high fixed) · **Chinese IME working** ✓

See [PROJECT-STATUS.md](./PROJECT-STATUS.md) for the full quality dashboard.

---

## 🤖 Built-in Agents

Switch between two built-in agents with the `Tab` key:

- **build** — Default, full-access development agent
- **plan** — Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases

Also includes a **general** subagent for complex searches. Invoke with `@general`.

---

## 📋 TUI Commands

| Command | Description |
|---------|-------------|
| `/locale zh` | Switch UI to Chinese |
| `/locale en` | Switch UI to English |
| `/diag` | Open diagnostics panel |
| `/compact` | Compact conversation history |
| `/clear` | Clear current session |
| `/theme <name>` | Switch color theme |
| `/share` | Share session via URL |
| `Tab` | Switch between build/plan agents |
| `F9` | Open tools dialog |

---

## 📦 Project Structure

```
opencode-cn/
├── packages/
│   ├── opencode/          # Core AI coding agent engine
│   ├── console/           # Web-based management console
│   ├── web/               # Web UI assets and screenshots
│   ├── sdk/               # SDK for integrations
│   ├── cli/               # CLI entry point
│   └── types/             # Shared type definitions
├── infra/                 # Infrastructure (SST, Pulumi)
├── docs/                  # Documentation
├── specs/                 # Design specifications
├── script/                # Build and utility scripts
├── sdks/                  # Generated SDKs
└── github/                # GitHub Actions workflows
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

Please ensure your changes:
- Pass all existing tests (`bun run --cwd packages/opencode test`)
- Add tests for new functionality
- Follow the existing code style
- Include i18n keys for any new UI strings

---

## 📄 License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.

---

## 🙏 Acknowledgments

- [Bun](https://bun.sh) — JavaScript runtime and package manager
- [OpenCode](https://github.com/sst/opencode) — Original upstream project
- All contributors and testers in the Chinese developer community

---

<p align="center">
  <a href="https://github.com/xusu-ai/opencode-cn">GitHub</a> |
  <a href="https://gitee.com/xusuai/opencode-cn">Gitee</a>
</p>
