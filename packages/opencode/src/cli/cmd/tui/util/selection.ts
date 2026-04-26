import * as Clipboard from "./clipboard"
import en from "../i18n/en"

type Toast = {
  show: (input: { message: string; variant: "info" | "success" | "warning" | "error" }) => void
  error: (err: unknown) => void
}

type Renderer = {
  getSelection: () => { getSelectedText: () => string } | null
  clearSelection: () => void
}

export function copy(renderer: Renderer, toast: Toast): boolean {
  const text = renderer.getSelection()?.getSelectedText()
  if (!text) return false

  Clipboard.copy(text)
    .then(() => toast.show({ message: en["tui.app.copiedToClipboard"], variant: "info" }))
    .catch(toast.error)

  renderer.clearSelection()
  return true
}
