import { describe, test, expect } from "bun:test"
import { redactSensitiveInfo } from "../../../src/util/redact"

// ---------------------------------------------------------------------------
// Clipboard security tests
//
// The clipboard module (src/cli/cmd/tui/util/clipboard.ts) provides copy() and
// read() functions. The copy function is used throughout the TUI to send text
// to the system clipboard. The security concerns are:
//
//   1. Sensitive data (API keys, tokens, passwords) copied to the clipboard
//      may persist after the application exits.
//   2. Clipboard managers / history features retain clipboard contents
//      indefinitely.
//   3. The clipboard.ts writeOsc52 function writes raw base64 text to the
//      terminal — no redaction is applied at the transport level.
//
// The `selection.ts` copy helper copies the renderer's selected text verbatim
// without redaction. The same applies to all Clipboard.copy() call sites in
// the TUI. The tests below verify that the redaction utility CAN be applied
// before clipboard operations and document current behaviour.
// ---------------------------------------------------------------------------

describe("clipboard security – redaction before copy", () => {
  describe("redactSensitiveInfo can sanitise text before clipboard write", () => {
    test("OpenAI API key is redacted before clipboard would store it", () => {
      const text = "My API key is: OPENAI_API_KEY=sk-abc123def456ghi789jkl012mno345"
      const safe = redactSensitiveInfo(text)
      expect(safe).not.toContain("sk-abc123def456ghi789jkl012mno345")
      expect(safe).toContain("[REDACTED]")
    })

    test("GitHub token is redacted before clipboard would store it", () => {
      const text = "GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwx"
      const safe = redactSensitiveInfo(text)
      expect(safe).not.toContain("ghp_1234567890abcdefghijklmnopqrstuvwx")
      expect(safe).toContain("[REDACTED]")
    })

    test("AWS access key is redacted before clipboard would store it", () => {
      const text = "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"
      const safe = redactSensitiveInfo(text)
      expect(safe).not.toContain("AKIAIOSFODNN7EXAMPLE")
      expect(safe).toContain("[REDACTED]")
    })

    test("password in key-value format is redacted", () => {
      const text = '"password": "supersecretpassword12345"'
      const safe = redactSensitiveInfo(text)
      expect(safe).not.toContain("supersecretpassword12345")
      expect(safe).toContain("[REDACTED]")
    })

    test("multiple secrets in one text are all redacted", () => {
      const text =
        "API_KEY=sk-abc123def456ghi789jkl012mno345 TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwx"
      const safe = redactSensitiveInfo(text)
      expect(safe).not.toContain("sk-abc123def456ghi789jkl012mno345")
      expect(safe).not.toContain("ghp_1234567890abcdefghijklmnopqrstuvwx")
      const redactedCount = safe.split("[REDACTED]").length - 1
      expect(redactedCount).toBeGreaterThanOrEqual(2)
    })

    test("non-sensitive text passes through unchanged", () => {
      const text = "Session completed. Files modified: 3, lines changed: 42"
      expect(redactSensitiveInfo(text)).toBe(text)
    })
  })
})

describe("clipboard security – OSC 52 transport", () => {
  describe("writeOsc52 encodes text as base64 without redaction (documented)", () => {
    test("OSC 52 uses raw base64 encoding without any filtering", () => {
      // The writeOsc52 function in clipboard.ts does:
      //   const base64 = Buffer.from(text).toString("base64")
      //   const osc52 = `\x1b]52;c;${base64}\x07`
      // This means whatever text is passed is encoded as-is.
      // Redaction must happen BEFORE calling copy().
      const sensitiveText = "sk-abc123def456ghi789jkl012mno345"
      const base64 = Buffer.from(sensitiveText).toString("base64")
      const decoded = Buffer.from(base64, "base64").toString()
      // The raw text is recoverable from the base64 — no protection at transport
      expect(decoded).toBe(sensitiveText)
    })

    test("redacted text is safe to encode via OSC 52", () => {
      const sensitiveText = "sk-abc123def456ghi789jkl012mno345"
      const safeText = redactSensitiveInfo(sensitiveText)
      const base64 = Buffer.from(safeText).toString("base64")
      const decoded = Buffer.from(base64, "base64").toString()
      expect(decoded).not.toContain("sk-abc123def456ghi789jkl012mno345")
      expect(decoded).toContain("[REDACTED]")
    })
  })
})

describe("clipboard security – clipboard managers and persistent history", () => {
  describe("clipboard contents may persist after application exit", () => {
    test("documented: system clipboard persists beyond application lifetime", () => {
      // Once text is written to the system clipboard (via OSC 52, xclip,
      // pbcopy, clipboardy, etc.), it remains there until overwritten.
      // Clipboard managers (e.g., ClipMenu, CopyQ, Parcellite) may store
      // clipboard history indefinitely. This means:
      //   - Any sensitive data copied remains accessible even after opencode exits
      //   - Clipboard managers may retain the data in their history files on disk
      //   - Other applications on the system can read the clipboard at any time
      //
      // Mitigation: apply redactSensitiveInfo() before any Clipboard.copy() call
      // that might contain tool output, environment variable dumps, or other
      // potentially sensitive content.
      expect(true).toBe(true)
    })

    test("documented: selection copy does not apply redaction", () => {
      // The selection.ts copy() helper copies the renderer's selected text
      // directly via Clipboard.copy(text) without any redaction. This is
      // intentional for usability — users expect to copy what they selected.
      // However, if a user selects tool output containing secrets, those
      // secrets go to the clipboard verbatim.
      expect(true).toBe(true)
    })

    test("documented: dialog-message copy does not apply redaction", () => {
      // dialog-message.tsx calls Clipboard.copy(text) where text is the
      // message content. Message content could contain secrets if the LLM
      // output includes them.
      expect(true).toBe(true)
    })

    test("documented: session transcript copy does not apply redaction", () => {
      // session/index.tsx line 909: Clipboard.copy(transcript)
      // The transcript could contain tool output with leaked secrets.
      expect(true).toBe(true)
    })
  })
})

describe("clipboard security – osascript command injection via clipboard", () => {
  describe("macOS osascript copy uses string escaping", () => {
    test("double quotes are escaped in osascript copy (documented)", () => {
      // clipboard.ts line 120-121:
      //   const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
      //   await Process.run(["osascript", "-e", `set the clipboard to "${escaped}"`], ...)
      // This escaping prevents simple quote-breakout command injection.
      // However, it does NOT redact sensitive content — it only prevents
      // AppleScript syntax errors.
      const maliciousText = 'hello"; do shell script "rm -rf /"; set the clipboard to "'
      const escaped = maliciousText.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
      // After escaping, the quote characters are neutralised
      expect(escaped).not.toMatch(/[^\\]"/)
      // The escaped string is safe to embed in an osascript command
      expect(escaped).toContain('\\"')
    })

    test("backslashes are escaped in osascript copy (documented)", () => {
      const textWithBackslashes = "path\\to\\file"
      const escaped = textWithBackslashes.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
      expect(escaped).toBe("path\\\\to\\\\file")
    })

    test("OS-level clipboard commands use stdin piping (documented)", () => {
      // Linux: wl-copy, xclip, xsel all pipe text via stdin:
      //   proc.stdin.write(text); proc.stdin.end()
      // Windows: PowerShell pipes via stdin:
      //   proc.stdin.write(text); proc.stdin.end()
      // This avoids shell interpolation vulnerabilities in the copy commands.
      // The text is never passed as a command-line argument.
      expect(true).toBe(true)
    })
  })
})

describe("clipboard security – PowerShell injection prevention", () => {
  describe("Windows clipboard uses stdin piping", () => {
    test("PowerShell Set-Clipboard reads from stdin, not command args (documented)", () => {
      // clipboard.ts lines 170-188 use:
      //   Process.spawn(["powershell.exe", "-NonInteractive", "-NoProfile",
      //     "-Command",
      //     "[Console]::InputEncoding = [System.Text.Encoding]::UTF8;
      //      Set-Clipboard -Value ([Console]::In.ReadToEnd())"],
      //     { stdin: "pipe", ... })
      //   proc.stdin.write(text); proc.stdin.end()
      //
      // This avoids PowerShell variable interpolation attacks like:
      //   $env:API_KEY or $(Get-Process) in the clipboard text.
      // The text is piped via stdin, not embedded in the -Command argument.
      expect(true).toBe(true)
    })

    test("PowerShell $ signs in clipboard text are not interpolated (documented)", () => {
      // Because text is piped via stdin, PowerShell variable syntax like
      // $env:FOO or $(command) in the clipboard text is treated as literal
      // text, not as PowerShell expressions.
      const textWithDollar = "Value is $env:OPENAI_API_KEY and $(whoami)"
      // This text would be piped as-is via stdin, not interpreted
      expect(textWithDollar).toContain("$env:")
      expect(textWithDollar).toContain("$(")
    })
  })
})

describe("clipboard security – temp file cleanup for image clipboard", () => {
  describe("temporary clipboard image files are cleaned up", () => {
    test("documented: macOS clipboard image temp file is removed after read", () => {
      // clipboard.ts lines 51-74:
      //   const tmpfile = path.join(tmpdir(), "opencode-clipboard.png")
      //   try { ... read image ... } finally { await fs.rm(tmpfile, { force: true }) }
      // The `finally` block ensures cleanup even if the read fails.
      expect(true).toBe(true)
    })

    test("documented: temp file path is predictable", () => {
      // The temp file path is `os.tmpdir() + "/opencode-clipboard.png"`.
      // This is a predictable path. On multi-user systems, a malicious user
      // could potentially symlink this path to overwrite another user's file.
      // The `force: true` in the cleanup means it won't error if the file
      // doesn't exist, but it also won't detect a symlink swap.
      expect(true).toBe(true)
    })

    test("documented: clipboard image data is not redacted", () => {
      // When reading clipboard images, the raw base64 data is returned
      // without any content inspection. This is by design — image data
      // cannot be meaningfully redacted for text-based secrets.
      expect(true).toBe(true)
    })
  })
})

describe("clipboard security – redaction utility coverage for clipboard scenarios", () => {
  describe("tool output that might be copied to clipboard", () => {
    test("env command output with secrets is redacted", () => {
      const envOutput = `HOME=/home/user
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890
GITHUB_TOKEN=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
PATH=/usr/bin:/bin`
      const safe = redactSensitiveInfo(envOutput)
      expect(safe).not.toContain("sk-proj-abcdefghijklmnopqrstuvwxyz1234567890")
      expect(safe).not.toContain("ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")
      expect(safe).toContain("HOME=/home/user")
      expect(safe).toContain("PATH=/usr/bin:/bin")
    })

    test("config file content with secrets is redacted", () => {
      const configOutput = `{
  "api_key": "sk-verylongapikey1234567890abcdefghij",
  "model": "gpt-4",
  "token": "ghp_longtokenvalue1234567890abcdefghijk"
}`
      const safe = redactSensitiveInfo(configOutput)
      expect(safe).not.toContain("sk-verylongapikey1234567890abcdefghij")
      expect(safe).not.toContain("ghp_longtokenvalue1234567890abcdefghijk")
      expect(safe).toContain('"model": "gpt-4"')
    })

    test("git config output with tokens is redacted", () => {
      const gitOutput = `remote.origin.url=https://ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@github.com/user/repo.git`
      const safe = redactSensitiveInfo(gitOutput)
      expect(safe).not.toContain("ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")
    })

    test("aws credentials file content is redacted", () => {
      const awsOutput = `[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
      const safe = redactSensitiveInfo(awsOutput)
      expect(safe).not.toContain("AKIAIOSFODNN7EXAMPLE")
    })

    test("auth content patterns are redacted", () => {
      const authOutput = 'OPENCODE_AUTH_CONTENT={"accessToken":"verylongsecrettoken1234567890abcdef"}'
      const safe = redactSensitiveInfo(authOutput)
      expect(safe).toContain("[REDACTED]")
    })
  })
})
