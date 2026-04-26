/**
 * Robustness utilities for the TUI layer.
 *
 * Pure, testable functions extracted from component/context code so that
 * fallback, sanitisation, and backpressure logic can be unit-tested without
 * a rendering environment.
 */

// ---------------------------------------------------------------------------
// i18n fallback
// ---------------------------------------------------------------------------

/**
 * Create a translator function with English-fallback behaviour.
 *
 * Mirrors the logic in `context/i18n.tsx`:
 *   1. Look up the key in the current dictionary.
 *   2. If the result is `undefined` and the locale is not "en", fall back to
 *      the English dictionary.
 *   3. For an empty-string key, return `undefined` gracefully (no crash).
 */
export function createFallbackTranslator(options: {
  dict: Record<string, string>
  enDict: Record<string, string>
  locale: string
}) {
  const { dict, enDict, locale } = options
  return function t(path: string): string | undefined {
    // Direct lookup in current dictionary
    const result = dict[path]
    if (result !== undefined) return result
    // Fallback to English dictionary when the current locale is not English
    if (locale !== "en") return enDict[path]
    return undefined
  }
}

// ---------------------------------------------------------------------------
// ANSI & control-character stripping
// ---------------------------------------------------------------------------

/** Well-known ANSI escape-sequence patterns. */
const ANSI_PATTERN =
  // eslint-disable-next-line no-control-regex
  /\x1b\][^\x07]*\x07|\x1b\][^\x1b]*\x1b\\|\x1b[PX^_][^\x1b]*\x1b\\|[\x1b\x9b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

/**
 * Strip common ANSI escape sequences from a string.
 *
 * Handles:
 * - CSI sequences  (`ESC [ … final_byte`)
 * - OSC sequences  (`ESC ] … BEL`  or  `ESC ] … ST`)
 * - DCS / SOS / PM / APC strings
 *
 * Returns the clean, human-readable text.
 */
export function stripAnsi(input: string): string {
  if (!input) return input
  return input.replace(ANSI_PATTERN, "")
}

/**
 * Remove control characters (C0 and C1) from a string while preserving
 * newlines (`\n`), carriage returns (`\r`), and tabs (`\t`).
 *
 * Useful for cleaning terminal-title strings or other user-facing text that
 * should never contain invisible control bytes.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g

export function stripControlChars(input: string): string {
  if (!input) return input
  return input.replace(CONTROL_CHAR_PATTERN, "")
}

// ---------------------------------------------------------------------------
// Backpressure – line truncation
// ---------------------------------------------------------------------------

/** Default limits matching `context/sync.tsx`. */
export const DEFAULT_MAX_PART_LINES = 5000
export const DEFAULT_MAX_PART_CHARS = 500_000

/**
 * Truncate a multi-line string so that it does not exceed `maxLines`.
 *
 * When the input exceeds the limit, the *oldest* lines are dropped and a
 * summary prefix is prepended:
 *
 *     "…(N earlier lines truncated)\n<kept lines>"
 *
 * This mirrors the inline backpressure logic in `context/sync.tsx` for the
 * `message.part.delta` event handler.
 */
export function truncateToMaxLines(
  input: string,
  maxLines: number = DEFAULT_MAX_PART_LINES,
): string {
  if (!input) return input
  if (maxLines <= 0) return ""
  const lines = input.split("\n")
  if (lines.length <= maxLines) return input
  const kept = lines.slice(lines.length - maxLines)
  return "…(" + (lines.length - maxLines) + " earlier lines truncated)\n" + kept.join("\n")
}

// ---------------------------------------------------------------------------
// Config / env-route parsing
// ---------------------------------------------------------------------------

export type HomeRoute = { type: "home" }
export type SessionRoute = { type: "session"; sessionID: string }
export type PluginRoute = { type: "plugin"; id: string; data?: Record<string, unknown> }
export type Route = HomeRoute | SessionRoute | PluginRoute

/**
 * Parse the `OPENCODE_ROUTE` environment variable value into a `Route` object.
 *
 * Returns `undefined` for invalid or empty input, mirroring the try/catch
 * fallback in `context/route.tsx`.
 */
export function parseEnvRoute(value: string | undefined): Route | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as Route
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Paste size limit
// ---------------------------------------------------------------------------

/** Maximum paste size in characters (100 KB). Matches `prompt/index.tsx`. */
export const MAX_PASTE_SIZE = 100_000

/**
 * Enforce the paste-size limit.
 *
 * If `content.length > MAX_PASTE_SIZE`, the content is truncated to
 * `MAX_PASTE_SIZE` characters and a truncation marker is appended.
 * Otherwise the original content is returned unchanged.
 *
 * (The real prompt handler silently rejects oversized pastes; this function
 * provides a testable truncation variant.)
 */
export function enforcePasteLimit(
  content: string,
  maxSize: number = MAX_PASTE_SIZE,
): string {
  if (content.length <= maxSize) return content
  return content.slice(0, maxSize) + "…[truncated]"
}

/**
 * Check whether a paste should be rejected due to size.
 *
 * Returns `true` when the content exceeds the limit (matching the `return`
 * early-exit in the onPaste handler).
 */
export function isPasteOverLimit(
  content: string,
  maxSize: number = MAX_PASTE_SIZE,
): boolean {
  return content.length > maxSize
}
