# Contributing to OpenCode

We want to make it easy for you to contribute to OpenCode. Here are the most common type of changes that get merged:

- Bug fixes
- Additional LSPs / Formatters
- Improvements to LLM performance
- Support for new providers
- Fixes for environment-specific quirks
- Missing standard behavior
- Documentation improvements
- **i18n translations** (see below)

However, any UI or core product feature must go through a design review with the core team before implementation.

If you are unsure if a PR would be accepted, feel free to ask a maintainer or look for issues with any of the following labels:

- [`help wanted`](https://github.com/anomalyco/opencode/issues?q=is%3Aissue+state%3Aopen+label%3Ahelp-wanted)
- [`good first issue`](https://github.com/anomalyco/opencode/issues?q=is%3Aissue+state%3Aopen+label%3A%22good+first+issue%22)
- [`bug`](https://github.com/anomalyco/opencode/issues?q=is%3Aissue+state%3Aopen+label%3Abug)
- [`perf`](https://github.com/anomalyco/opencode/issues?q=is%3Aopen+is%3Aissue+label%3A%22perf%22)

> [!NOTE]
> PRs that ignore these guardrails will likely be closed.

Want to take on an issue? Leave a comment and a maintainer may assign it to you unless it is something we are already working on.

## Adding New Providers

New providers shouldn't require many if ANY code changes, but if you want to add support for a new provider first make a PR to:
https://github.com/anomalyco/models.dev

## Developing OpenCode

- Requirements: Bun 1.3+
- Install dependencies and start the dev server from the repo root:

  ```bash
  bun install
  bun dev
  ```

### Running against a different directory

By default, `bun dev` runs OpenCode in the `packages/opencode` directory. To run it against a different directory or repository:

```bash
bun dev <directory>
```

To run OpenCode in the root of the opencode repo itself:

```bash
bun dev .
```

### Building a "localcode"

To compile a standalone executable:

```bash
./packages/opencode/script/build.ts --single
```

Then run it with:

```bash
./packages/opencode/dist/opencode-<platform>/bin/opencode
```

Replace `<platform>` with your platform (e.g., `darwin-arm64`, `linux-x64`).

- Core pieces:
  - `packages/opencode`: OpenCode core business logic & server.
  - `packages/opencode/src/cli/cmd/tui/`: The TUI code, written in SolidJS with [opentui](https://github.com/sst/opentui)
  - `packages/app`: The shared web UI components, written in SolidJS
  - `packages/desktop`: The native desktop app, built with Tauri (wraps `packages/app`)
  - `packages/plugin`: Source for `@opencode-ai/plugin`

### Understanding bun dev vs opencode

During development, `bun dev` is the local equivalent of the built `opencode` command. Both run the same CLI interface:

```bash
# Development (from project root)
bun dev --help           # Show all available commands
bun dev serve            # Start headless API server
bun dev web              # Start server + open web interface
bun dev <directory>      # Start TUI in specific directory

# Production
opencode --help          # Show all available commands
opencode serve           # Start headless API server
opencode web             # Start server + open web interface
opencode <directory>     # Start TUI in specific directory
```

### Running the API Server

To start the OpenCode headless API server:

```bash
bun dev serve
```

This starts the headless server on port 4096 by default. You can specify a different port:

```bash
bun dev serve --port 8080
```

### Running the Web App

To test UI changes during development:

1. **First, start the OpenCode server** (see [Running the API Server](#running-the-api-server) section above)
2. **Then run the web app:**

```bash
bun run --cwd packages/app dev
```

This starts a local dev server at http://localhost:5173 (or similar port shown in output). Most UI changes can be tested here, but the server must be running for full functionality.

### Running the Desktop App

The desktop app is a native Tauri application that wraps the web UI.

To run the native desktop app:

```bash
bun run --cwd packages/desktop tauri dev
```

This starts the web dev server on http://localhost:1420 and opens the native window.

If you only want the web dev server (no native shell):

```bash
bun run --cwd packages/desktop dev
```

To create a production `dist/` and build the native app bundle:

```bash
bun run --cwd packages/desktop tauri build
```

This runs `bun run --cwd packages/desktop build` automatically via Tauri's `beforeBuildCommand`.

> [!NOTE]
> Running the desktop app requires additional Tauri dependencies (Rust toolchain, platform-specific libraries). See the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for setup instructions.

> [!NOTE]
> If you make changes to the API or SDK (e.g. `packages/opencode/src/server/server.ts`), run `./script/generate.ts` to regenerate the SDK and related files.

Please try to follow the [style guide](./AGENTS.md)

### Setting up a Debugger

Bun debugging is currently rough around the edges. We hope this guide helps you get set up and avoid some pain points.

The most reliable way to debug OpenCode is to run it manually in a terminal via `bun run --inspect=<url> dev ...` and attach
your debugger via that URL. Other methods can result in breakpoints being mapped incorrectly, at least in VSCode (YMMV).

Caveats:

- If you want to run the OpenCode TUI and have breakpoints triggered in the server code, you might need to run `bun dev spawn` instead of
  the usual `bun dev`. This is because `bun dev` runs the server in a worker thread and breakpoints might not work there.
- If `spawn` does not work for you, you can debug the server separately:
  - Debug server: `bun run --inspect=ws://localhost:6499/ --cwd packages/opencode ./src/index.ts serve --port 4096`,
    then attach TUI with `opencode attach http://localhost:4096`
  - Debug TUI: `bun run --inspect=ws://localhost:6499/ --cwd packages/opencode --conditions=browser ./src/index.ts`

Other tips and tricks:

- You might want to use `--inspect-wait` or `--inspect-brk` instead of `--inspect`, depending on your workflow
- Specifying `--inspect=ws://localhost:6499/` on every invocation can be tiresome, you may want to `export BUN_OPTIONS=--inspect=ws://localhost:6499/` instead

#### VSCode Setup

If you use VSCode, you can use our example configurations [.vscode/settings.example.json](.vscode/settings.example.json) and [.vscode/launch.example.json](.vscode/launch.example.json).

Some debug methods that can be problematic:

- Debug configurations with `"request": "launch"` can have breakpoints incorrectly mapped and thus unusable
- The same problem arises when running OpenCode in the VSCode `JavaScript Debug Terminal`

With that said, you may want to try these methods, as they might work for you.

---

## i18n 翻译贡献指南 / i18n Translation Guide

OpenCode TUI 支持国际化 (i18n)，目前已有**中文 (zh)** 和**英文 (en)** 语言包。欢迎贡献新的语言翻译！

### 语言包位置

```
packages/opencode/src/cli/cmd/tui/i18n/
├── en.ts    # 英文语言包（基准，634+ keys）
└── zh.ts    # 中文语言包
```

### 如何添加新语言

1. **复制基准文件**：将 `en.ts` 复制为你的语言代码文件（如 `ja.ts`、`fr.ts`、`ko.ts`）
   ```bash
   cp packages/opencode/src/cli/cmd/tui/i18n/en.ts packages/opencode/src/cli/cmd/tui/i18n/ja.ts
   ```

2. **修改类型声明**：将 `Record<string, string>` 改为 `Dictionary`（从 `en.ts` 导入）
   ```typescript
   import type { Dictionary } from "./en"
   const ja: Dictionary = { ... }
   ```

3. **翻译所有键值**：逐一翻译每个键的值。**不要修改键名**，只修改值

4. **注册语言**：在 i18n 模块的类型定义和加载逻辑中注册新语言

5. **测试**：启动 opencode，输入 `/locale ja` 验证翻译效果

### Key 命名规范

- 格式：`tui.<模块>.<描述>`，如 `tui.command.switchSession`、`tui.error.sessionNotFound`
- 命令面板键：`tui.command.*`
- 状态栏键：`tui.status.*`
- 对话框键：`tui.dialog.*`
- 错误信息键：`tui.error.*`
- 提示/技巧键：`tui.tips.*`
- 帮助键：`tui.help.*`

### 翻译质量要求

1. **准确性**：翻译应准确传达原文含义，不要直译导致歧义
2. **一致性**：同一概念在所有键中使用相同翻译（如 "session" 统一翻译为 "会话"）
3. **简洁性**：TUI 界面空间有限，翻译应尽量简短
4. **保留占位符**：`{{keybind}}`、`{highlight}...{/highlight}` 等占位符**不可翻译**，必须原样保留
5. **不可翻译项**：日志字段名、协议字段、变量名、命令名（如 `/locale`、`/diag`）保持英文

### 测试翻译

```bash
# 启动开发服务器
bun dev

# 在 TUI 中输入
/locale zh    # 切换中文
/locale en    # 切换英文
/locale ja    # 切换日文（如已添加）
```

检查要点：
- 无空白文本（缺失键会自动回退英文）
- 无布局溢出（中文通常比英文短，但某些语言如德语可能更长）
- 快捷键占位符 `{{keybind}}` 正确渲染
- 主题切换后文本正确显示

---

## Running Tests

```bash
# Run all tests
bun test

# Run security tests only
bun test packages/opencode/test/tui/security/

# Run type checking
bun typecheck
# or
npx tsc --noEmit
```

### CI Pipeline

Every PR triggers our CI pipeline (`.github/workflows/security-ci.yml`) with the following jobs:

1. **TypeCheck** — `bun typecheck`
2. **Lint** — `bun lint` (if configured)
3. **Security Tests** — 132 security-specific tests
4. **Unit Tests** — `bun test` for all test files
5. **Security Audit** — `bun audit` for known dependency vulnerabilities
6. **Build Check** — `bun build` verification

---

## Pull Request Expectations

### Issue First Policy

**All PRs must reference an existing issue.** Before opening a PR, open an issue describing the bug or feature. This helps maintainers triage and prevents duplicate work. PRs without a linked issue may be closed without review.

- Use `Fixes #123` or `Closes #123` in your PR description to link the issue
- For small fixes, a brief issue is fine - just enough context for maintainers to understand the problem

### General Requirements

- Keep pull requests small and focused
- Explain the issue and why your change fixes it
- Before adding new functionality, ensure it doesn't already exist elsewhere in the codebase

### UI Changes

If your PR includes UI changes, please include screenshots or videos showing the before and after. This helps maintainers review faster and gives you quicker feedback.

### Logic Changes

For non-UI changes (bug fixes, new features, refactors), explain **how you verified it works**:

- What did you test?
- How can a reviewer reproduce/confirm the fix?

### No AI-Generated Walls of Text

Long, AI-generated PR descriptions and issues are not acceptable and may be ignored. Respect the maintainers' time:

- Write short, focused descriptions
- Explain what changed and why in your own words
- If you can't explain it briefly, your PR might be too large

### PR Titles

PR titles should follow conventional commit standards:

- `feat:` new feature or functionality
- `fix:` bug fix
- `docs:` documentation or README changes
- `chore:` maintenance tasks, dependency updates, etc.
- `refactor:` code refactoring without changing behavior
- `test:` adding or updating tests
- `security:` security fixes and hardening

You can optionally include a scope to indicate which package is affected:

- `feat(app):` feature in the app package
- `fix(desktop):` bug fix in the desktop package
- `chore(opencode):` maintenance in the opencode package

Examples:

- `docs: update contributing guidelines`
- `fix: resolve crash on startup`
- `feat: add dark mode support`
- `feat(app): add dark mode support`
- `fix(desktop): resolve crash on startup`
- `chore: bump dependency versions`
- `security: sanitize environment variables in child processes`

### Style Preferences

These are not strictly enforced, they are just general guidelines:

- **Functions:** Keep logic within a single function unless breaking it out adds clear reuse or composition benefits.
- **Destructuring:** Do not do unnecessary destructuring of variables.
- **Control flow:** Avoid `else` statements.
- **Error handling:** Prefer `.catch(...)` instead of `try`/`catch` when possible.
- **Types:** Reach for precise types and avoid `any`.
- **Variables:** Stick to immutable patterns and avoid `let`.
- **Naming:** Choose concise single-word identifiers when they remain descriptive.
- **Runtime APIs:** Use Bun helpers such as `Bun.file()` when they fit the use case.

## Feature Requests

For net-new functionality, start with a design conversation. Open an issue describing the problem, your proposed approach (optional), and why it belongs in OpenCode. The core team will help decide whether it should move forward; please wait for that approval instead of opening a feature PR directly.

## Trust & Vouch System

This project uses [vouch](https://github.com/mitchellh/vouch) to manage contributor trust. The vouch list is maintained in [`.github/VOUCHED.td`](.github/VOUCHED.td).

### How it works

- **Vouched users** are explicitly trusted contributors.
- **Denounced users** are explicitly blocked. Issues and pull requests from denounced users are automatically closed. If you have been denounced, you can request to be unvouched by reaching out to a maintainer on [Discord](https://opencode.ai/discord)
- **Everyone else** can participate normally — you don't need to be vouched to open issues or PRs.

### For maintainers

Collaborators with write access can manage the vouch list by commenting on any issue:

- `vouch` — vouch for the issue author
- `vouch @username` — vouch for a specific user
- `denounce` — denounce the issue author
- `denounce @username` — denounce a specific user
- `denounce @username <reason>` — denounce with a reason
- `unvouch` / `unvouch @username` — remove someone from the list

Changes are committed automatically to `.github/VOUCHED.td`.

### Denouncement policy

Denouncement is reserved for users who repeatedly submit low-quality AI-generated contributions, spam, or otherwise act in bad faith. It is not used for disagreements or honest mistakes.

## Issue Requirements

All issues **must** use one of our issue templates:

- **Bug report** — for reporting bugs (requires a description)
- **Feature request** — for suggesting enhancements (requires verification checkbox and description)
- **Question** — for asking questions (requires the question)

Blank issues are not allowed. When a new issue is opened, an automated check verifies that it follows a template and meets our contributing guidelines. If an issue doesn't meet the requirements, you'll receive a comment explaining what needs to be fixed and have **2 hours** to edit the issue. After that, it will be automatically closed.

Issues may be flagged for:

- Not using a template
- Required fields left empty or filled with placeholder text
- AI-generated walls of text
- Missing meaningful content

If you believe your issue was incorrectly flagged, let a maintainer know.
