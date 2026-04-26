// Security: Redact sensitive information from text before writing to disk or logs.
// This prevents accidental credential leakage in crash dumps and log files.

/**
 * Removes or masks common secret patterns from a string:
 * - Key-value patterns like "api_key": "***" or token=ghp_... (both quoted and unquoted)
 * - Known service key prefixes: OpenAI (sk-...), GitHub (ghp_...), AWS (AKIA...)
 * - Env-style patterns: API_KEY=sk-..., GITHUB_TOKEN=ghp_...
 */
export function redactSensitiveInfo(text: string): string {
  let result = text

  // Redact key-value pairs where the key suggests a secret and the value is long enough
  // Pattern 1: Quoted values (JSON/object style) — "api_key": "sk-..." or token: 'value'
  result = result.replace(
    /["']?(?:api[_-]?key|token|secret|password|credential|auth)["']?\s*[:=]\s*["'][^"']{8,}["']/gi,
    (match) => {
      // Preserve the key portion, replace the value
      return match.replace(/(["'][^"']{8,}["'])$/, '"[REDACTED]"')
    },
  )

  // Pattern 2: Unquoted env-style values — API_KEY=sk-..., GITHUB_TOKEN=ghp_...
  // Security: This covers `env`, `printenv`, and shell export output formats
  result = result.replace(
    /\b(?:[\w]*API[_-]?KEY|[\w]*TOKEN|[\w]*SECRET|[\w]*PASSWORD|[\w]*CREDENTIAL|AWS_[\w]+)\s*=\s*[^\s"']{8,}/gi,
    (match) => {
      const eqIndex = match.indexOf("=")
      if (eqIndex === -1) return match
      return match.substring(0, eqIndex + 1) + "[REDACTED]"
    },
  )

  // Redact OpenAI API key patterns (sk- followed by 20+ alphanumeric chars)
  result = result.replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED]")

  // Redact GitHub personal access tokens (ghp_ followed by 36 alphanumeric chars)
  result = result.replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED]")

  // Redact AWS access key IDs (AKIA followed by 16 uppercase alphanumeric chars)
  result = result.replace(/AKIA[A-Z0-9]{16}/g, "[REDACTED]")

  return result
}
