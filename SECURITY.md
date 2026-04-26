# Security

## IMPORTANT

We do not accept AI generated security reports. We receive a large number of
these and we absolutely do not have the resources to review them all. If you
submit one that will be an automatic ban from the project.

## Threat Model

### Overview

OpenCode is an AI-powered coding assistant that runs locally on your machine. It provides an agent system with access to powerful tools including shell execution, file operations, and web access.

### No Sandbox

OpenCode does **not** sandbox the agent. The permission system exists as a UX feature to help users stay aware of what actions the agent is taking - it prompts for confirmation before executing commands, writing files, etc. However, it is not designed to provide security isolation.

If you need true isolation, run OpenCode inside a Docker container or VM.

### Server Mode

Server mode is opt-in only. When enabled, set `OPENCODE_SERVER_PASSWORD` to require HTTP Basic Auth. Without this, the server runs unauthenticated (with a warning). It is the end user's responsibility to secure the server - any functionality it provides is not a vulnerability.

### Out of Scope

| Category                        | Rationale                                                               |
| ------------------------------- | ----------------------------------------------------------------------- |
| **Server access when opted-in** | If you enable server mode, API access is expected behavior              |
| **Sandbox escapes**             | The permission system is not a sandbox (see above)                      |
| **LLM provider data handling**  | Data sent to your configured LLM provider is governed by their policies |
| **MCP server behavior**         | External MCP servers you configure are outside our trust boundary       |
| **Malicious config files**      | Users control their own config; modifying it is not an attack vector    |

---

## Security Audit Results (2026-04-25)

A comprehensive security audit was conducted on the opencode codebase. Full details are available in [SECURITY-REPORT.md](./SECURITY-REPORT.md).

### Summary

| Severity | Found | Fixed | Accepted Risk |
|----------|-------|-------|---------------|
| CRITICAL | 6     | 3     | 3 (by-design) |
| HIGH     | 11    | 3     | 8 (by-design/deferred) |
| MEDIUM   | 12    | 2     | 10 (documented) |
| LOW      | 7     | 0     | 7 (informational) |

### Fixed Vulnerabilities

1. **AppFileSystem.contains() symlink bypass** (CRITICAL) — Added `path.resolve()` normalization to prevent `..` path traversal
2. **applyHunksToFiles() no path validation** (HIGH) — Added workdir boundary validation
3. **sanitizedProcessEnv() not filtering secrets** (HIGH) — Added `SENSITIVE_KEY_PATTERNS` to filter sensitive environment variables from child processes
4. **redactSensitiveInfo() missing from crash dumps** (HIGH) — Dual-pattern redaction now strips API keys, tokens, and passwords
5. **HTTP 500 stack trace leakage** (MEDIUM) — Server errors no longer expose stack traces
6. **Clipboard TOCTOU vulnerability** (MEDIUM) — Temporary clipboard files use crypto-random suffixes
7. **ANSI injection in MCP tool output** (MEDIUM) — Control characters stripped before rendering
8. **Transcript ANSI injection** (MEDIUM) — `stripAnsi()` applied to tool output in transcript

### Known Security Limitations

These are accepted risks per the project's threat model:

- **Bash tool command execution** — LLM-provided commands executed via `shell: true`. The permission/ask system is a UX feature, not a security boundary.
- **Template argument interpolation** — User arguments in `!`...`` template patterns are not shell-escaped. Shell escaping would break legitimate use cases.
- **MCP config command execution** — MCP server commands from `opencode.json` config are spawned via `StdioClientTransport`. Users control their own config.
- **MCP tools path access** — MCP tool calls pass arguments directly to the MCP server with no `Instance.containsPath()` check. MCP servers are outside the trust boundary.
- **Worktree startCommand** — `input.extra` passed to `bash -lc <cmd>` unsanitized. The `startCommand` field is explicitly for running user-specified commands.
- **KV store plaintext secrets** — The KV store may contain API keys in plaintext. Recommend using system keychain for production use.
- **bypassCwdCheck internal flag** — The read tool supports a `bypassCwdCheck` flag from `ctx.extra`. This is internal-only and not exposed to user input.

### Security Testing

132 dedicated security tests are maintained under `packages/opencode/test/tui/security/`:

- `security-redaction.test.ts` — Sensitive info redaction in logs and crash dumps
- `path-boundary.test.ts` — Path traversal prevention
- `env-sanitization.test.ts` — Environment variable filtering for child processes
- `command-injection.test.ts` — Command injection defense
- `clipboard-security.test.ts` — Clipboard TOCTOU and temp file safety

CI security scanning runs automatically via `.github/workflows/security-ci.yml`.

---

# Reporting Security Issues

We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

To report a security issue, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/anomalyco/opencode/security/advisories/new) tab.

The team will send a response indicating the next steps in handling your report. After the initial reply to your report, the security team will keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

## Escalation

If you do not receive an acknowledgement of your report within 6 business days, you may send an email to security@anoma.ly
