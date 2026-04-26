import { TextAttributes } from "@opentui/core"
import { useTheme } from "../context/theme"
import { useI18n } from "../context/i18n"
import { useDialog } from "@tui/ui/dialog"
import { useSync } from "@tui/context/sync"
import { For, Show, createMemo } from "solid-js"
import { diagMemory, diagPerfLog } from "../context/diag"

export function DialogDiag() {
  const sync = useSync()
  const { theme } = useTheme()
  const dialog = useDialog()
  const { t } = useI18n()

  const mem = createMemo(() => diagMemory())
  const perfLog = createMemo(() => diagPerfLog())

  const stats = createMemo(() => {
    const data = sync.data
    const sessionIDs = Object.keys(data.message)
    let totalMessages = 0
    let totalParts = 0
    for (const id of sessionIDs) {
      totalMessages += data.message[id]?.length ?? 0
    }
    totalParts = Object.keys(data.part).length
    return {
      sessions: sessionIDs.length,
      totalMessages,
      totalParts,
      status: data.status,
      providers: data.provider.length,
      agents: data.agent.length,
    }
  })

  const recentPerf = createMemo(() => perfLog().slice(-10).reverse())

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.text} attributes={TextAttributes.BOLD}>
          {t("tui.diag.title")}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          {t("tui.diag.esc")}
        </text>
      </box>

      {/* Memory */}
      <text fg={theme.text} attributes={TextAttributes.BOLD}>
        {t("tui.diag.memory")}
      </text>
      <box flexDirection="row" gap={2}>
        <text fg={theme.text}>
          heapUsed: <span style={{ fg: theme.success }}>{mem().heapUsed}</span>
        </text>
        <text fg={theme.text}>
          heapTotal: <span style={{ fg: theme.textMuted }}>{mem().heapTotal}</span>
        </text>
        <text fg={theme.text}>
          rss: <span style={{ fg: theme.textMuted }}>{mem().rss}</span>
        </text>
        <text fg={theme.text}>
          external: <span style={{ fg: theme.textMuted }}>{mem().external}</span>
        </text>
      </box>

      {/* Stats */}
      <text fg={theme.text} attributes={TextAttributes.BOLD}>
        {t("tui.diag.stats")}
      </text>
      <box flexDirection="row" gap={2}>
        <text fg={theme.text}>
          {t("tui.diag.sessions")}: {stats().sessions}
        </text>
        <text fg={theme.text}>
          {t("tui.diag.messages")}: {stats().totalMessages}
        </text>
        <text fg={theme.text}>
          {t("tui.diag.parts")}: {stats().totalParts}
        </text>
        <text fg={theme.text}>
          {t("tui.diag.providers")}: {stats().providers}
        </text>
        <text fg={theme.text}>
          {t("tui.diag.agents")}: {stats().agents}
        </text>
      </box>
      <text fg={theme.textMuted}>
        status: {stats().status}
      </text>

      {/* Perf log */}
      <text fg={theme.text} attributes={TextAttributes.BOLD}>
        {t("tui.diag.recentOps", { count: recentPerf().length })}
      </text>
      <Show
        when={recentPerf().length > 0}
        fallback={<text fg={theme.textMuted}>{t("tui.diag.noPerfData")}</text>}
      >
        <For each={recentPerf()}>
          {(entry) => (
            <box flexDirection="row" gap={1}>
              <text fg={theme.textMuted}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </text>
              <text fg={theme.text}>{entry.label}</text>
              <text
                style={{
                  fg: entry.duration > 1000 ? theme.error : entry.duration > 100 ? theme.warning : theme.success,
                }}
              >
                {entry.duration.toFixed(1)}ms
              </text>
            </box>
          )}
        </For>
      </Show>
    </box>
  )
}
