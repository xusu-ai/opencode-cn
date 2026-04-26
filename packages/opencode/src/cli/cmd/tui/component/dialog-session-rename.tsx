import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { useDialog } from "@tui/ui/dialog"
import { useI18n } from "@tui/context/i18n"
import { useSync } from "@tui/context/sync"
import { createMemo } from "solid-js"
import { useSDK } from "../context/sdk"

interface DialogSessionRenameProps {
  session: string
}

export function DialogSessionRename(props: DialogSessionRenameProps) {
  const dialog = useDialog()
  const sync = useSync()
  const sdk = useSDK()
  const { t } = useI18n()
  const session = createMemo(() => sync.session.get(props.session))

  return (
    <DialogPrompt
      title={t("tui.sessionRename.title")}
      value={session()?.title}
      onConfirm={(value) => {
        void sdk.client.session.update({
          sessionID: props.session,
          title: value,
        }).catch(() => {})
        dialog.clear()
      }}
      onCancel={() => dialog.clear()}
    />
  )
}
