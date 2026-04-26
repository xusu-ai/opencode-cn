import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { sanitizedProcessEnv } from "../../../src/util/opencode-process"

describe("sanitizedProcessEnv", () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Snapshot and replace env for isolated testing
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe("dangerous env vars are filtered", () => {
    test("filters out NODE_OPTIONS", () => {
      process.env.NODE_OPTIONS = "--require ./malicious.js"
      const result = sanitizedProcessEnv()
      expect(result.NODE_OPTIONS).toBeUndefined()
    })

    test("filters out LD_PRELOAD", () => {
      process.env.LD_PRELOAD = "/tmp/malicious.so"
      const result = sanitizedProcessEnv()
      expect(result.LD_PRELOAD).toBeUndefined()
    })

    test("filters out LD_LIBRARY_PATH", () => {
      process.env.LD_LIBRARY_PATH = "/tmp/malicious/lib"
      const result = sanitizedProcessEnv()
      expect(result.LD_LIBRARY_PATH).toBeUndefined()
    })

    test("filters out DYLD_ prefixed variables", () => {
      process.env.DYLD_INSERT_LIBRARIES = "/tmp/malicious.dylib"
      process.env.DYLD_LIBRARY_PATH = "/tmp/malicious/lib"
      const result = sanitizedProcessEnv()
      expect(result.DYLD_INSERT_LIBRARIES).toBeUndefined()
      expect(result.DYLD_LIBRARY_PATH).toBeUndefined()
    })
  })

  describe("sensitive key patterns are filtered", () => {
    test("filters keys ending with _API_KEY", () => {
      process.env.MY_API_KEY = "sk-supersecretkey1234567890"
      const result = sanitizedProcessEnv()
      expect(result.MY_API_KEY).toBeUndefined()
    })

    test("filters keys ending with _TOKEN", () => {
      process.env.GITHUB_TOKEN = "ghp_abc123"
      const result = sanitizedProcessEnv()
      expect(result.GITHUB_TOKEN).toBeUndefined()
    })

    test("filters keys ending with _SECRET", () => {
      process.env.APP_SECRET = "mysecretvalue"
      const result = sanitizedProcessEnv()
      expect(result.APP_SECRET).toBeUndefined()
    })

    test("filters keys ending with _PASSWORD", () => {
      process.env.DB_PASSWORD = "dbpass123"
      const result = sanitizedProcessEnv()
      expect(result.DB_PASSWORD).toBeUndefined()
    })

    test("filters keys ending with _CREDENTIAL", () => {
      process.env.GCP_CREDENTIAL = '{"type":"service_account"}'
      const result = sanitizedProcessEnv()
      expect(result.GCP_CREDENTIAL).toBeUndefined()
    })

    test("filters AWS_ prefixed keys", () => {
      process.env.AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
      process.env.AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG"
      process.env.AWS_SESSION_TOKEN = "token123"
      const result = sanitizedProcessEnv()
      expect(result.AWS_ACCESS_KEY_ID).toBeUndefined()
      expect(result.AWS_SECRET_ACCESS_KEY).toBeUndefined()
      expect(result.AWS_SESSION_TOKEN).toBeUndefined()
    })

    test("filters OPENCODE_AUTH_CONTENT", () => {
      process.env.OPENCODE_AUTH_CONTENT = '{"oauth":{"accessToken":"secret"}}'
      const result = sanitizedProcessEnv()
      expect(result.OPENCODE_AUTH_CONTENT).toBeUndefined()
    })

    test("filtering is case-insensitive for key patterns", () => {
      process.env.MY_api_key = "sensitive"
      process.env.GITHUB_token = "sensitive"
      process.env.APP_Secret = "sensitive"
      const result = sanitizedProcessEnv()
      expect(result.MY_api_key).toBeUndefined()
      expect(result.GITHUB_token).toBeUndefined()
      expect(result.APP_Secret).toBeUndefined()
    })
  })

  describe("normal env vars pass through", () => {
    test("passes through common non-sensitive env vars", () => {
      process.env.PATH = "/usr/bin:/bin"
      process.env.HOME = "/home/user"
      process.env.LANG = "en_US.UTF-8"
      process.env.TERM = "xterm-256color"
      const result = sanitizedProcessEnv()
      expect(result.PATH).toBe("/usr/bin:/bin")
      expect(result.HOME).toBe("/home/user")
      expect(result.LANG).toBe("en_US.UTF-8")
      expect(result.TERM).toBe("xterm-256color")
    })

    test("passes through opencode-specific non-sensitive vars", () => {
      process.env.OPENCODE_RUN_ID = "some-uuid"
      process.env.OPENCODE_PROCESS_ROLE = "worker"
      const result = sanitizedProcessEnv()
      expect(result.OPENCODE_RUN_ID).toBe("some-uuid")
      expect(result.OPENCODE_PROCESS_ROLE).toBe("worker")
    })

    test("passes through custom application vars", () => {
      process.env.APP_MODE = "production"
      process.env.DEBUG_LEVEL = "verbose"
      process.env.LOG_FORMAT = "json"
      const result = sanitizedProcessEnv()
      expect(result.APP_MODE).toBe("production")
      expect(result.DEBUG_LEVEL).toBe("verbose")
      expect(result.LOG_FORMAT).toBe("json")
    })

    test("does not include undefined values", () => {
      const result = sanitizedProcessEnv()
      const undefinedValues = Object.values(result).filter((v) => v === undefined)
      expect(undefinedValues.length).toBe(0)
    })
  })

  describe("overrides work correctly", () => {
    test("overrides add new keys to the sanitized env", () => {
      const result = sanitizedProcessEnv({ CUSTOM_KEY: "custom_value" })
      expect(result.CUSTOM_KEY).toBe("custom_value")
    })

    test("overrides can re-add filtered keys", () => {
      // A sensitive key is filtered, but override can explicitly add it back
      process.env.MY_API_KEY = "should-be-filtered"
      const result = sanitizedProcessEnv({ MY_API_KEY: "explicitly-allowed" })
      expect(result.MY_API_KEY).toBe("explicitly-allowed")
    })

    test("overrides can replace existing non-sensitive values", () => {
      process.env.PATH = "/usr/bin"
      const result = sanitizedProcessEnv({ PATH: "/custom/bin" })
      expect(result.PATH).toBe("/custom/bin")
    })

    test("multiple overrides are all applied", () => {
      const result = sanitizedProcessEnv({
        KEY_A: "value_a",
        KEY_B: "value_b",
        KEY_C: "value_c",
      })
      expect(result.KEY_A).toBe("value_a")
      expect(result.KEY_B).toBe("value_b")
      expect(result.KEY_C).toBe("value_c")
    })

    test("overrides do not affect filtering of non-overridden sensitive keys", () => {
      process.env.NODE_OPTIONS = "--require ./evil.js"
      process.env.MY_SECRET = "supersecret"
      const result = sanitizedProcessEnv({ CUSTOM_VAR: "safe" })
      expect(result.NODE_OPTIONS).toBeUndefined()
      expect(result.MY_SECRET).toBeUndefined()
      expect(result.CUSTOM_VAR).toBe("safe")
    })
  })

  describe("edge cases", () => {
    test("keys with API_KEY in the middle are not filtered (pattern requires suffix)", () => {
      process.env.MY_API_KEY_BACKUP = "not-sensitive-by-pattern"
      const result = sanitizedProcessEnv()
      // The pattern /_API_KEY$/i requires _API_KEY at the end
      // MY_API_KEY_BACKUP does not end with _API_KEY, so it should pass
      expect(result.MY_API_KEY_BACKUP).toBe("not-sensitive-by-pattern")
    })

    test("AWS_ prefix matches anywhere in the key prefix", () => {
      process.env.AWS_CUSTOM_VAR = "somevalue"
      const result = sanitizedProcessEnv()
      // /^AWS_/i matches any key starting with AWS_
      expect(result.AWS_CUSTOM_VAR).toBeUndefined()
    })
  })
})
