import { For } from "solid-js"
import { DEFAULT_THEMES, useTheme } from "@tui/context/theme"
import { useI18n } from "@tui/context/i18n"

const themeCount = Object.keys(DEFAULT_THEMES).length

type TipPart = { text: string; highlight: boolean }

function parse(tip: string): TipPart[] {
  const parts: TipPart[] = []
  const regex = /\{highlight\}(.*?)\{\/highlight\}/g
  const found = Array.from(tip.matchAll(regex))
  const state = found.reduce(
    (acc, match) => {
      const start = match.index ?? 0
      if (start > acc.index) {
        acc.parts.push({ text: tip.slice(acc.index, start), highlight: false })
      }
      acc.parts.push({ text: match[1], highlight: true })
      acc.index = start + match[0].length
      return acc
    },
    { parts, index: 0 },
  )

  if (state.index < tip.length) {
    parts.push({ text: tip.slice(state.index), highlight: false })
  }

  return parts
}

function getTips(t: ReturnType<typeof useI18n>["t"]) {
  return [
    t("tui.tips.tip01"),
    t("tui.tips.tip02"),
    t("tui.tips.tip03"),
    t("tui.tips.tip04"),
    t("tui.tips.tip05"),
    t("tui.tips.tip06"),
    t("tui.tips.tip07"),
    t("tui.tips.tip08"),
    t("tui.tips.tip09"),
    t("tui.tips.tip10"),
    t("tui.tips.tip11"),
    t("tui.tips.tip12", { count: themeCount }),
    t("tui.tips.tip13"),
    t("tui.tips.tip14"),
    t("tui.tips.tip15"),
    t("tui.tips.tip16"),
    t("tui.tips.tip17"),
    t("tui.tips.tip18"),
    t("tui.tips.tip19"),
    t("tui.tips.tip20"),
    t("tui.tips.tip21"),
    t("tui.tips.tip22"),
    t("tui.tips.tip23"),
    t("tui.tips.tip24"),
    t("tui.tips.tip25"),
    t("tui.tips.tip26"),
    t("tui.tips.tip27"),
    t("tui.tips.tip28"),
    t("tui.tips.tip29"),
    t("tui.tips.tip30"),
    t("tui.tips.tip31"),
    t("tui.tips.tip32"),
    t("tui.tips.tip33"),
    t("tui.tips.tip34"),
    t("tui.tips.tip35"),
    t("tui.tips.tip36"),
    t("tui.tips.tip37"),
    t("tui.tips.tip38"),
    t("tui.tips.tip39"),
    t("tui.tips.tip40"),
    t("tui.tips.tip41"),
    t("tui.tips.tip42"),
    t("tui.tips.tip43"),
    t("tui.tips.tip44"),
    t("tui.tips.tip45"),
    t("tui.tips.tip46"),
    t("tui.tips.tip47"),
    t("tui.tips.tip48"),
    t("tui.tips.tip49"),
    t("tui.tips.tip50"),
    t("tui.tips.tip51"),
    t("tui.tips.tip52"),
    t("tui.tips.tip53"),
    t("tui.tips.tip54"),
    t("tui.tips.tip55"),
    t("tui.tips.tip56"),
    t("tui.tips.tip57"),
    t("tui.tips.tip58"),
    t("tui.tips.tip59"),
    t("tui.tips.tip60"),
    t("tui.tips.tip61"),
    t("tui.tips.tip62"),
    t("tui.tips.tip63"),
    t("tui.tips.tip64"),
    t("tui.tips.tip65"),
    t("tui.tips.tip66"),
    t("tui.tips.tip67"),
    t("tui.tips.tip68"),
    t("tui.tips.tip69"),
    t("tui.tips.tip70"),
    t("tui.tips.tip71"),
    t("tui.tips.tip72"),
    t("tui.tips.tip73"),
    t("tui.tips.tip74"),
    t("tui.tips.tip75"),
    t("tui.tips.tip76"),
    t("tui.tips.tip77"),
    t("tui.tips.tip78"),
    t("tui.tips.tip79"),
    t("tui.tips.tip80"),
    t("tui.tips.tip81"),
    t("tui.tips.tip82"),
    t("tui.tips.tip83"),
    t("tui.tips.tip84"),
    t("tui.tips.tip85"),
    t("tui.tips.tip86"),
    t("tui.tips.tip87"),
    t("tui.tips.tip88"),
    t("tui.tips.tip89"),
    t("tui.tips.tip90"),
    t("tui.tips.tip91"),
    t("tui.tips.tip92"),
    t("tui.tips.tip93"),
    t("tui.tips.tip94"),
    t("tui.tips.tip95"),
    t("tui.tips.tip96"),
    t("tui.tips.tip97"),
    t("tui.tips.tip98"),
    t("tui.tips.tip99"),
    ...(process.platform === "win32"
      ? [t("tui.tips.tip91win")]
      : [t("tui.tips.tip91unix")]),
  ]
}

export function Tips() {
  const theme = useTheme().theme
  const { t } = useI18n()
  const tips = getTips(t)
  const parts = parse(tips[Math.floor(Math.random() * tips.length)])

  return (
    <box flexDirection="row" maxWidth="100%">
      <text flexShrink={0} style={{ fg: theme.warning }}>
        ● {t("tui.tips.label")}{" "}
      </text>
      <text flexShrink={1}>
        <For each={parts}>
          {(part) => <span style={{ fg: part.highlight ? theme.text : theme.textMuted }}>{part.text}</span>}
        </For>
      </text>
    </box>
  )
}
