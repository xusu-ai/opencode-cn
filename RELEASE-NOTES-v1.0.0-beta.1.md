# Release v1.0.0-beta.1 — Security Hardened & i18n Ready

## 🌐 Internationalization (i18n)

OpenCode TUI now supports **Chinese and English** with instant switching:

- **634+ translation keys** covering all TUI elements — command palette, status bar, dialogs, tips, help, error messages
- `/locale zh` / `/locale en` — switch language instantly, no restart required
- Automatic English fallback for missing keys — no more blank UI
- Type-safe `Dictionary` type ensures translation key completeness

## 🔒 Security Hardening (5 Rounds)

Comprehensive security audit identified **36 findings** across 8 categories. **8 critical/high vulnerabilities fixed**:

### Fixed
- **Path traversal bypass** — `AppFileSystem.contains()` now resolves and normalizes paths
- **Hunk application path escape** — `applyHunksToFiles()` validates workdir boundaries
- **Environment variable leak** — `sanitizedProcessEnv()` now filters `*_API_KEY`, `*_TOKEN`, `NODE_OPTIONS`, `LD_PRELOAD`
- **Sensitive info in crash dumps** — `redactSensitiveInfo()` strips API keys, tokens, passwords
- **HTTP 500 stack trace leakage** — Server errors no longer expose stack traces
- **Clipboard TOCTOU vulnerability** — Random suffix prevents symlink races
- **ANSI injection in MCP output** — Control characters stripped before rendering
- **Transcript ANSI injection** — `stripAnsi()` applied to tool output

### Testing
- **132 dedicated security tests** across 5 test files
- **CI security pipeline** — 6-job workflow with typecheck, lint, security tests, audit, build check
- **Dependabot** — weekly automated dependency updates

## ⚡ Performance & Diagnostics

- **`/diag` command** — Real-time performance panel (render stats, memory, event loop)
- **Virtual message list** — `MAX_VISIBLE_MESSAGES=50` for 100K+ message sessions
- **Text backpressure** — `MAX_PART_LINES=5000` / `MAX_PART_CHARS=500_000`
- **Crash dump** — Automatic with sensitive info redacted
- **Input debounce** — Avoid unnecessary re-renders

## 🛡️ Stability

- **11 event listener leak fixes** — `onCleanup()` prevents memory leaks on repeated mount/unmount
- **15 deep memory safety patches** — Crash prevention hardening
- **Storage engine fault tolerance** — Graceful degradation when KV store unavailable
- **Locale fallback** — Missing i18n keys fall back to English

## 📝 Documentation

- **README.md / README.zh.md** — Restructured with i18n, security, performance sections
- **CONTRIBUTING.md** — Added i18n translation contribution guide
- **CHANGELOG.md** — Keep a Changelog format, covering all hardening rounds
- **SECURITY.md** — Updated with audit results and known limitations
- **SECURITY-REPORT.md** — Full 36-finding audit report
- **STABILITY-REPORT.md** / **PERF-REPORT.md** / **ROBUSTNESS-REPORT.md** — Detailed technical reports

## 🧹 Repository Hygiene

- **`.gitignore`** — Added `auth.json`, `crash-dump*.json`, `*.pem`, `*.key`, `.env.*` patterns
- **No sensitive files tracked** — Verified clean git tree
- **Dependabot configured** — Weekly dependency scanning

---

**Full Changelog**: See [CHANGELOG.md](./CHANGELOG.md)  
**Security Details**: See [SECURITY.md](./SECURITY.md) and [SECURITY-REPORT.md](./SECURITY-REPORT.md)
