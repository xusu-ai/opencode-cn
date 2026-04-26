export const OPENCODE_RUN_ID = "OPENCODE_RUN_ID"
export const OPENCODE_PROCESS_ROLE = "OPENCODE_PROCESS_ROLE"

export function ensureRunID() {
  return (process.env[OPENCODE_RUN_ID] ??= crypto.randomUUID())
}

export function ensureProcessRole(fallback: "main" | "worker") {
  return (process.env[OPENCODE_PROCESS_ROLE] ??= fallback)
}

export function ensureProcessMetadata(fallback: "main" | "worker") {
  return {
    runID: ensureRunID(),
    processRole: ensureProcessRole(fallback),
  }
}

// Security: Patterns matching environment variable keys that contain sensitive data.
// These keys are stripped before passing env to child processes to prevent credential leakage.
const SENSITIVE_KEY_PATTERNS = [
  /_API_KEY$/i,
  /_TOKEN$/i,
  /_SECRET$/i,
  /_PASSWORD$/i,
  /_CREDENTIAL$/i,
  /^AWS_/i,
  /^NODE_OPTIONS$/i,
  /^LD_PRELOAD$/i,
  /^LD_LIBRARY_PATH$/i,
  /^DYLD_/i,
  /^OPENCODE_AUTH_CONTENT$/i,
]

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

export function sanitizedProcessEnv(overrides?: Record<string, string>) {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined && !isSensitiveKey(entry[0]),
    ),
  )
  return overrides ? Object.assign(env, overrides) : env
}
