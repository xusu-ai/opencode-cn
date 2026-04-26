import { describe, test, expect } from "bun:test"
import { redactSensitiveInfo } from "../../../src/util/redact"

describe("redactSensitiveInfo", () => {
  describe("API key patterns", () => {
    test("redacts OpenAI API key in key=value format", () => {
      const input = "OPENAI_API_KEY=sk-abc123def456ghi789jkl012mno345"
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("sk-abc123def456ghi789jkl012mno345")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts OpenAI API key in JSON format", () => {
      const input = '"api_key": "sk-abc123def456ghi789jkl012mno345pqr678"'
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("sk-abc123def456ghi789jkl012mno345pqr678")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts inline sk- pattern regardless of context", () => {
      const input = "Using key sk-proj1234567890abcdefghijklmnopqrs to authenticate"
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("sk-proj1234567890abcdefghijklmnopqrs")
      expect(result).toContain("[REDACTED]")
    })

    test("does not redact short sk- values (fewer than 20 chars after prefix)", () => {
      const input = "prefix sk-short value"
      const result = redactSensitiveInfo(input)
      // sk-short is only 5 chars after prefix, below the 20-char threshold
      expect(result).toContain("sk-short")
    })
  })

  describe("GitHub token patterns", () => {
    test("redacts GitHub personal access token in key=value format", () => {
      const input = "GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz"
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("ghp_1234567890abcdefghijklmnopqrstuvwxyz")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts GitHub token in JSON format", () => {
      const input = '"token": "ghp_1234567890abcdefghijklmnopqrstuvwxyz"'
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("ghp_1234567890abcdefghijklmnopqrstuvwxyz")
      expect(result).toContain("[REDACTED]")
    })

    test("does not redact incomplete ghp_ values", () => {
      const input = "ghp_short"
      const result = redactSensitiveInfo(input)
      expect(result).toContain("ghp_short")
    })
  })

  describe("AWS key patterns", () => {
    test("redacts AWS access key ID in key=value format", () => {
      const input = "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts AWS key inline in text", () => {
      const input = "Configured with AKIAIOSFODNN7EXAMPLE for AWS"
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE")
      expect(result).toContain("[REDACTED]")
    })

    test("does not redact short AKIA values", () => {
      const input = "AKIA123"
      const result = redactSensitiveInfo(input)
      expect(result).toContain("AKIA123")
    })
  })

  describe("Auth content patterns", () => {
    test("redacts auth content with accessToken in JSON", () => {
      const input = 'OPENCODE_AUTH_CONTENT={"oauth":{"accessToken":"secret12345678"}}'
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("secret12345678")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts password in key-value pair", () => {
      const input = '"password": "supersecretpassword12345"'
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("supersecretpassword12345")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts secret in key-value pair", () => {
      const input = '"secret": "mylongsecretvalue12345"'
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("mylongsecretvalue12345")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts credential in key-value pair", () => {
      const input = '"credential": "longcredentialvalue9876"'
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("longcredentialvalue9876")
      expect(result).toContain("[REDACTED]")
    })

    test("redacts token in key-value pair", () => {
      const input = '"token": "longtokenvalueabcdefg"'
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("longtokenvalueabcdefg")
      expect(result).toContain("[REDACTED]")
    })
  })

  describe("passthrough for normal text", () => {
    test("leaves normal text unchanged", () => {
      const input = "The quick brown fox jumps over the lazy dog"
      expect(redactSensitiveInfo(input)).toBe(input)
    })

    test("leaves non-sensitive key-value pairs unchanged", () => {
      const input = '"username": "testuser"'
      expect(redactSensitiveInfo(input)).toBe(input)
    })

    test("leaves short values in sensitive keys unchanged", () => {
      // Values shorter than 8 chars are not redacted in key-value patterns
      const input = '"password": "short"'
      expect(redactSensitiveInfo(input)).toBe(input)
    })

    test("handles empty string", () => {
      expect(redactSensitiveInfo("")).toBe("")
    })

    test("handles text with no sensitive patterns", () => {
      const input = "PATH=/usr/bin HOME=/home/user LANG=en_US.UTF-8"
      expect(redactSensitiveInfo(input)).toBe(input)
    })
  })

  describe("multiple patterns in same text", () => {
    test("redacts multiple sensitive values in one string", () => {
      const input =
        'api_key=sk-longapikey1234567890abcd token=ghp_1234567890abcdefghijklmnopqrstuvwxyz'
      const result = redactSensitiveInfo(input)
      expect(result).not.toContain("sk-longapikey1234567890abcd")
      expect(result).not.toContain("ghp_1234567890abcdefghijklmnopqrstuvwxyz")
      // Should have two [REDACTED] markers
      const redactedCount = result.split("[REDACTED]").length - 1
      expect(redactedCount).toBeGreaterThanOrEqual(2)
    })

    test("redacts mix of sensitive and non-sensitive content", () => {
      const input =
        'user=admin key=AKIAIOSFODNN7EXAMPLE host=localhost'
      const result = redactSensitiveInfo(input)
      expect(result).toContain("user=admin")
      expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE")
      expect(result).toContain("host=localhost")
    })
  })
})
