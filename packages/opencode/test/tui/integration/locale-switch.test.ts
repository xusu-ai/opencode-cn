import { describe, test, expect } from "bun:test"

describe("Locale switch", () => {
  // TODO: implement integration test — requires TUI runtime + storage
  test.skip("switch locale to zh and back", async () => {
    // 1. Start TUI with default locale (en)
    // 2. Switch locale to zh via command / settings
    // 3. Verify all visible labels switch to Chinese
    // 4. Switch back to en
    // 5. Verify labels revert to English
    expect(true).toBe(true)
  })

  // TODO: implement integration test — requires TUI runtime + persistent storage
  test.skip("persist locale across restarts", async () => {
    // 1. Start TUI, switch locale to zh
    // 2. Shut down TUI
    // 3. Restart TUI
    // 4. Verify locale is still zh without manual re-selection
    expect(true).toBe(true)
  })

  // TODO: implement integration test — requires TUI runtime + read-only storage mock
  test.skip("readonly storage locale fallback", async () => {
    // 1. Configure storage to be read-only (cannot write locale preference)
    // 2. Attempt to switch locale
    // 3. Verify TUI falls back gracefully (default locale or last readable value)
    // 4. Verify no unhandled errors / crashes
    expect(true).toBe(true)
  })
})
