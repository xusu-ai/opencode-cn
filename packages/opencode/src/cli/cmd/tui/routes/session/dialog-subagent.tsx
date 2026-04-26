import { DialogSelect } from "@tui/ui/dialog-select"
import { useRoute } from "@tui/context/route"
import { useI18n } from "@tui/context/i18n"

export function DialogSubagent(props: { sessionID: string }) {
  const { t } = useI18n()
  const route = useRoute()

  return (
    <DialogSelect
      title={t("tui.subagent.title")}
      options={[
        {
          title: t("tui.subagent.open"),
          value: "subagent.view",
          description: t("tui.subagent.openDesc"),
          onSelect: (dialog) => {
            route.navigate({
              type: "session",
              sessionID: props.sessionID,
            })
            dialog.clear()
          },
        },
      ]}
    />
  )
}
