<p align="center">
  <a href="https://gitee.com/xusuai/opencode-cn">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode logo">
    </picture>
  </a>
</p>
<p align="center">The open source AI coding agent.</p>
<p align="center">
  <a href="https://opencode.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/opencode-ai"><img alt="npm" src="https://img.shields.io/npm/v/opencode-ai?style=flat-square" /></a>
  <a href="https://github.com/anomalyco/opencode/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/badge/release-v1.0.0--CN-blue?style=flat-square" /></a>
  <img alt="Tests" src="https://img.shields.io/badge/tests-248%20pass-brightgreen?style=flat-square" />
  <img alt="Security" src="https://img.shields.io/badge/security-132%20tests-blue?style=flat-square" />
  <img alt="Hardening" src="https://img.shields.io/badge/hardened-8%20rounds-orange?style=flat-square" />
  <img alt="IME" src="https://img.shields.io/badge/IME-Chinese%20Input%20%E2%9C%93-brightgreen?style=flat-square" />
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

### Installation

```bash
# YOLO
curl -fsSL https://opencode.ai/install | bash

# Package managers
npm i -g opencode-ai@latest        # or bun/pnpm/yarn
scoop install opencode             # Windows
choco install opencode             # Windows
brew install anomalyco/tap/opencode # macOS and Linux (recommended, always up to date)
brew install opencode              # macOS and Linux (official brew formula, updated less)
sudo pacman -S opencode            # Arch Linux (Stable)
paru -S opencode-bin               # Arch Linux (Latest from AUR)
mise use -g opencode               # Any OS
nix run nixpkgs#opencode           # or github:anomalyco/opencode for latest dev branch
```

> [!TIP]
> Remove versions older than 0.1.x before installing.

### Desktop App (BETA)

OpenCode is also available as a desktop application. Download directly from the [releases page](https://gitee.com/xusuai/opencode-cn/releases).

| Platform              | Download                              |
| --------------------- | ------------------------------------- |
| macOS (Apple Silicon) | `opencode-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `opencode-desktop-darwin-x64.dmg`     |
| Windows               | `opencode-desktop-windows-x64.exe`    |
| Linux                 | `.deb`, `.rpm`, or AppImage           |

```bash
# macOS (Homebrew)
brew install --cask opencode-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/opencode-desktop
```

#### Installation Directory

The install script respects the following priority order for the installation path:

1. `$OPENCODE_INSTALL_DIR` - Custom installation directory
2. `$XDG_BIN_DIR` - XDG Base Directory Specification compliant path
3. `$HOME/bin` - Standard user binary directory (if it exists or can be created)
4. `$HOME/.opencode/bin` - Default fallback

```bash
# Examples
OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://opencode.ai/install | bash
```

---

### Features

#### 🌐 i18n — Internationalization

OpenCode TUI supports **Chinese and English** with a single-key switch:

- **634+ translation keys** covering all TUI elements — command palette, status bar, dialogs, tips, help, errors
- Type `/locale zh` to switch to Chinese, `/locale en` to switch back — **no restart required**
- Missing keys fall back to English automatically, preventing blank UI
- Language packs: `packages/opencode/src/cli/cmd/tui/i18n/en.ts` and `zh.ts`

> **TODO:** Screenshots of Chinese/English interface side-by-side

#### 🀄 Chinese Input Method (IME) Support — A First for Terminal AI Agents

OpenCode is the **first terminal-based AI coding agent** to support **Chinese (CJK) input methods** natively in the TUI:

- **Root cause discovered**: opentui's `createCliRenderer` applies `null ?? {}` to `useKittyKeyboard`, so setting `null` actually **enables** Kitty protocol — which encodes all keystrokes as CSI escape sequences that bypass IME composition entirely
- **Fix**: Explicit `renderer.disableKittyKeyboard()` after creation, which sends `\x1b[>1u` to disable Kitty protocol and resets the stdin parser
- **Environment**: IBus / Fcitx5 auto-detected; works out-of-the-box with `GTK_IM_MODULE=ibus` / `XMODIFIERS=@im=ibus`
- **Result**: Full Chinese Pinyin input with candidate selection works seamlessly in gnome-terminal, WezTerm, and other IME-aware terminals

> This was considered an **unsolvable problem** in terminal TUI applications — raw mode + IME has been a classic conflict. OpenCode solves it by precisely controlling the Kitty keyboard protocol lifecycle.

#### 🔒 Security Hardening

Five rounds of security audit and hardening with **132 dedicated security tests**:

- **Path traversal protection** — `AppFileSystem.contains()` now resolves and normalizes paths before comparison
- **Environment variable sanitization** — Child processes no longer inherit sensitive keys (`*_API_KEY`, `*_TOKEN`, `NODE_OPTIONS`, `LD_PRELOAD`, etc.)
- **Sensitive info redaction** — `redactSensitiveInfo()` strips API keys, tokens, and passwords from crash dumps and error logs
- **ANSI injection defense** — MCP tool output is stripped of control characters before rendering
- **Clipboard TOCTOU fix** — Temporary clipboard files use cryptographically random suffixes
- **HTTP error safety** — 500 responses no longer expose stack traces

See [SECURITY-REPORT.md](./SECURITY-REPORT.md) for the full 36-finding audit report.

#### ⚡ Performance & Diagnostics

- **`/diag` command** — Real-time performance panel showing render stats, memory usage, and event loop health
- **Virtual message list** — `MAX_VISIBLE_MESSAGES=50` with smart truncation for 100K+ message sessions
- **Text backpressure** — `MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000` prevents memory spikes from large tool output
- **Crash dump** — Automatic crash dump on unhandled errors with sensitive info redacted
- **Input debounce** — Keystroke debouncing to avoid unnecessary re-renders

See [PERF-REPORT.md](./PERF-REPORT.md) for detailed optimization results.

#### 🛡️ Stability

- **Event leak fixes** — 11 `event.on()` listeners fixed with `onCleanup()` to prevent memory leaks on repeated mount/unmount
- **Deep memory safety** — 15 additional hardening patches for crash prevention
- **Storage engine fault tolerance** — Graceful degradation when KV store is unavailable
- **Locale fallback** — Missing i18n keys fall back to English instead of showing blank text

See [STABILITY-REPORT.md](./STABILITY-REPORT.md) for the full report.

#### 🔌 MCP Tool Integration

OpenCode supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for extending the agent with custom tools:

- Configure MCP servers in `opencode.json`
- Auto-discovery and tool registration
- Permission-gated execution with user approval

---

### Agents

OpenCode includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about [agents](https://gitee.com/xusuai/opencode-cn).

### TUI Commands

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
| `?` | Show help |

### Documentation

For more info on how to configure OpenCode, [**head over to our docs**](https://gitee.com/xusuai/opencode-cn).

### Contributing

If you're interested in contributing to OpenCode, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on OpenCode

If you are working on a project that's related to OpenCode and is using "opencode" as part of its name, for example "opencode-dashboard" or "opencode-mobile", please add a note to your README to clarify that it is not built by the OpenCode team and is not affiliated with us in any way.

### 🏆 Industrial-Grade Stability — Eight Rounds of Hardening

OpenCode has undergone **eight systematic hardening rounds**, achieving production-level quality:

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

### FAQ

#### How is this different from Claude Code?

It's very similar to Claude Code in terms of capability. Here are the key differences:

- 100% open source
- Not coupled to any provider. OpenCode can be used with Claude, OpenAI, Google, or even local models. As models evolve, the gaps between them will close and pricing will drop, so being provider-agnostic is important.
- Out-of-the-box LSP support
- A focus on TUI. OpenCode is built by neovim users and the creators of [terminal.shop](https://terminal.shop); we are going to push the limits of what's possible in the terminal.
- A client/server architecture. This, for example, can allow OpenCode to run on your computer while you drive it remotely from a mobile app, meaning that the TUI frontend is just one of the possible clients.

---

**Join our community** [Discord](https://discord.gg/opencode) | [X.com](https://x.com/opencode)
