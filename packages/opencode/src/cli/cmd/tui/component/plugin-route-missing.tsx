import { useTheme } from "../context/theme"
import { useI18n } from "../context/i18n"

export function PluginRouteMissing(props: { id: string; onHome: () => void }) {
  const { theme } = useTheme()
  const { t } = useI18n()

  return (
    <box width="100%" height="100%" alignItems="center" justifyContent="center" flexDirection="column" gap={1}>
      <text fg={theme.warning}>{t("tui.pluginRouteMissing.title")}: {props.id}</text>
      <box onMouseUp={props.onHome} backgroundColor={theme.backgroundElement} paddingLeft={1} paddingRight={1}>
        <text fg={theme.text}>{t("tui.pluginRouteMissing.goHome")}</text>
      </box>
    </box>
  )
}
