import { createSignal, onMount, type ParentProps } from "solid-js"
import * as i18n from "@solid-primitives/i18n"
import { createSimpleContext } from "./helper"
import en, { type Dictionary } from "../i18n/en"
import zh from "../i18n/zh"
import { diagMark } from "./diag"

export type Locale = "en" | "zh"

const dictionaries: Record<Locale, Dictionary> = { en, zh }

function detectLocale(): Locale {
  // 1. 环境变量优先（支持 LC_ALL, LC_MESSAGES, LANG）
  const envLang = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || ""
  if (envLang.startsWith("zh")) return "zh"
  // 2. 默认英文
  return "en"
}

export interface I18nToast {
  show: (options: { variant: "info" | "success" | "warning" | "error"; message: string; title?: string; duration?: number }) => void
}

export const { use: useI18n, provider: I18nProvider } = createSimpleContext({
  name: "I18n",
  init: () => {
    // 从 KV 存储读取保存的语言偏好，或自动检测
    const [locale, setLocale] = createSignal<Locale>("en")
    const [dict, setDict] = createSignal<Dictionary>(en)

    let kvSet: ((key: string, value: any, onError?: (error: unknown) => void) => void) | null = null
    let kvGet: ((key: string, defaultValue?: any) => any) | null = null
    let toastRef: I18nToast | null = null

    onMount(() => {
      // 延迟读取 KV（KVProvider 可能还没 ready）
      // useKV 在 I18nProvider 外部调用，所以这里通过 props 传入
    })

    // 创建翻译函数（带缺失 key 的英文 fallback）
    const rawT = i18n.translator(() => dict() ?? en, i18n.resolveTemplate)
    const enT = i18n.translator(() => en, i18n.resolveTemplate)
    const t: typeof rawT = (path: string, ...args: any[]) => {
      const result = rawT(path, ...args)
      // 如果当前字典缺失 key，fallback 到英文
      if (result === undefined && locale() !== "en") {
        const enResult = enT(path, ...args)
        // 如果英文也缺失，返回 key 本身作为最终 fallback，防止 undefined 导致组件崩溃
        return enResult ?? path
      }
      // 即使是英文 locale，也确保不返回 undefined
      return result ?? path
    }

    function changeLocale(newLocale: Locale) {
      diagMark("i18n.changeLocale", () => {
      setLocale(newLocale)
      setDict(dictionaries[newLocale])
      })
    }

    function toggleLocale() {
      changeLocale(locale() === "en" ? "zh" : "en")
    }

    /** Handle a KV write failure: revert to 'en' and warn the user */
    function handlePersistError(requestedLocale: Locale, error: unknown) {
      console.warn(`Failed to persist locale "${requestedLocale}", reverting to "en":`, error)
      // Revert in-memory state to 'en'
      changeLocale("en")
      // Show friendly warning via toast (if available) or console
      if (toastRef) {
        toastRef.show({
          variant: "warning",
          title: "Locale",
          message: `Could not save language preference, reverted to English.`,
          duration: 5000,
        })
      } else {
        console.warn("Locale persistence failed: could not save language preference, reverted to English.")
      }
    }

    // 初始化：尝试从 KV 读取
    function initFromKV(kv: { get: (key: string, defaultValue?: any) => any; set: (key: string, value: any, onError?: (error: unknown) => void) => void }) {
      kvGet = kv.get.bind(kv)
      kvSet = kv.set.bind(kv)
      const saved = kvGet("locale") as Locale | undefined
      if (saved && dictionaries[saved]) {
        changeLocale(saved)
      } else {
        const detected = detectLocale()
        changeLocale(detected)
      }
    }

    function saveLocale(loc: Locale) {
      if (kvSet) kvSet("locale", loc, (error) => handlePersistError(loc, error))
    }

    // 包装 setLocale 使其自动持久化
    const persistLocale = (loc: Locale) => {
      changeLocale(loc)
      saveLocale(loc)
    }

    const persistToggle = () => {
      const next = locale() === "en" ? "zh" : "en"
      changeLocale(next)
      saveLocale(next)
    }

    function setToast(toast: I18nToast) {
      toastRef = toast
    }

    return {
      get locale() { return locale() },
      get dict() { return dict() },
      t,
      setLocale: persistLocale,
      toggleLocale: persistToggle,
      initFromKV,
      setToast,
    }
  },
})
