import { describe, test, expect } from "bun:test"
import { parseEnvRoute } from "@tui/util/robustness"

describe("parseEnvRoute", () => {
  test("valid JSON for home route returns correct object", () => {
    const result = parseEnvRoute('{"type":"home"}')
    expect(result).toEqual({ type: "home" })
  })

  test("valid JSON for session route returns correct object", () => {
    const result = parseEnvRoute('{"type":"session","sessionID":"abc123"}')
    expect(result).toEqual({ type: "session", sessionID: "abc123" })
  })

  test("valid JSON for plugin route returns correct object", () => {
    const result = parseEnvRoute('{"type":"plugin","id":"my-plugin","data":{"key":"value"}}')
    expect(result).toEqual({ type: "plugin", id: "my-plugin", data: { key: "value" } })
  })

  test("invalid JSON returns undefined", () => {
    const result = parseEnvRoute("not json at all")
    expect(result).toBeUndefined()
  })

  test("empty string returns undefined", () => {
    const result = parseEnvRoute("")
    expect(result).toBeUndefined()
  })

  test("undefined input returns undefined", () => {
    const result = parseEnvRoute(undefined)
    expect(result).toBeUndefined()
  })

  test("partially valid JSON (missing closing brace) returns undefined", () => {
    const result = parseEnvRoute('{"type":"home"')
    expect(result).toBeUndefined()
  })

  test("JSON string (not an object) returns the parsed value — caller validates shape", () => {
    // JSON.parse("123") returns 123, which is technically valid JSON
    // parseEnvRoute returns Route | undefined, so non-Route JSON results
    // are cast to Route at runtime — caller validates shape
    const result = parseEnvRoute("123") as unknown
    expect(result as number).toBe(123)
  })

  test("null JSON returns null", () => {
    const result = parseEnvRoute("null")
    expect(result).toBeNull()
  })

  test("route with prompt info parses correctly", () => {
    const result = parseEnvRoute('{"type":"home","prompt":{"input":"hello","parts":[]}}') as any
    expect(result).toEqual({ type: "home", prompt: { input: "hello", parts: [] } })
  })
})
