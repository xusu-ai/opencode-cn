import { render, TimeToFirstDraw, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/solid"
import * as Clipboard from "@tui/util/clipboard"
import * as Selection from "@tui/util/selection"
import * as Terminal from "@tui/util/terminal"
import { createCliRenderer, MouseButton, type CliRendererConfig } from "@opentui/core"
import { RouteProvider, useRoute } from "@tui/context/route"
import {
  Switch,
  Match,
  createEffect,
  createMemo,
  ErrorBoundary,
  createSignal,
  onCleanup,
  onMount,
  batch,
  Show,
  on,
} from "solid-js"
import { win32DisableProcessedInput, win32InstallCtrlCGuard } from "./win32"
import { Flag } from "@/flag/flag"
import semver from "semver"
import { DialogProvider, useDialog } from "@tui/ui/dialog"
import { DialogProvider as DialogProviderList } from "@tui/component/dialog-provider"
import { ErrorComponent } from "@tui/component/error-component"
import { PluginRouteMissing } from "@tui/component/plugin-route-missing"
import { ProjectProvider } from "@tui/context/project"
import { useEvent } from "@tui/context/event"
import { SDKProvider, useSDK } from "@tui/context/sdk"
import { StartupLoading } from "@tui/component/startup-loading"
import { SyncProvider, useSync } from "@tui/context/sync"
import { LocalProvider, useLocal } from "@tui/context/local"
import { DialogModel, useConnected } from "@tui/component/dialog-model"
import { DialogMcp } from "@tui/component/dialog-mcp"
import { DialogStatus } from "@tui/component/dialog-status"
import { DialogThemeList } from "@tui/component/dialog-theme-list"
import { DialogHelp } from "./ui/dialog-help"
import { CommandProvider, useCommandDialog } from "@tui/component/dialog-command"
import { DialogAgent } from "@tui/component/dialog-agent"
import { DialogSessionList } from "@tui/component/dialog-session-list"
import { DialogDiag } from "./component/dialog-diag"
import { DialogConsoleOrg } from "@tui/component/dialog-console-org"
import { KeybindProvider, useKeybind } from "@tui/context/keybind"
import { ThemeProvider, useTheme } from "@tui/context/theme"
import { Home } from "@tui/routes/home"
import { Session } from "@tui/routes/session"
import { PromptHistoryProvider } from "./component/prompt/history"
import { FrecencyProvider } from "./component/prompt/frecency"
import { PromptStashProvider } from "./component/prompt/stash"
import { DialogAlert } from "./ui/dialog-alert"
import { DialogConfirm } from "./ui/dialog-confirm"
import { ToastProvider, useToast } from "./ui/toast"
import { ExitProvider, useExit } from "./context/exit"
import { Session as SessionApi } from "@/session"
import { TuiEvent } from "./event"
import { KVProvider, useKV } from "./context/kv"
import { Provider } from "@/provider"
import { ArgsProvider, useArgs, type Args } from "./context/args"
import open from "open"
import { PromptRefProvider, usePromptRef } from "./context/prompt"
import { TuiConfigProvider, useTuiConfig } from "./context/tui-config"
import { TuiConfig } from "@/cli/cmd/tui/config/tui"
import { I18nProvider, useI18n } from "@tui/context/i18n"
import { createTuiApi, TuiPluginRuntime, type RouteMap } from "./plugin"
import { FormatError, FormatUnknownError } from "@/cli/error"

import type { EventSource } from "./context/sdk"
import { DialogVariant } from "./component/dialog-variant"

function rendererConfig(_config: TuiConfig.Info): CliRendererConfig {
  const mouseEnabled = !Flag.OPENCODE_DISABLE_MOUSE && (_config.mouse ?? true)

  return {
    externalOutputMode: "passthrough",
    targetFps: 60,
    gatherStats: false,
    exitOnCtrlC: false,
    useKittyKeyboard: null, // set null; createCliRenderer internally does null ?? {} = {} (enabling kitty), so we call disableKittyKeyboard() after creation
    autoFocus: false,
    openConsoleOnError: false,
    useMouse: mouseEnabled,
    consoleOptions: {
      keyBindings: [{ name: "y", ctrl: true, action: "copy-selection" }],
      onCopySelection: (text) => {
        Clipboard.copy(text).catch((error) => {
          console.error(`Failed to copy console selection to clipboard: ${error}`)
        })
      },
    },
  }
}

function errorMessage(error: unknown) {
  const formatted = FormatError(error)
  if (formatted !== undefined) return formatted
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message
  }
  return FormatUnknownError(error)
}

export function tui(input: {
  url: string
  args: Args
  config: TuiConfig.Info
  onSnapshot?: () => Promise<string[]>
  directory?: string
  fetch?: typeof fetch
  headers?: RequestInit["headers"]
  events?: EventSource
}) {
  // promise to prevent immediate exit
  // oxlint-disable-next-line no-async-promise-executor -- intentional: async executor used for sequential setup before resolve
  return new Promise<void>(async (resolve) => {
    const unguard = win32InstallCtrlCGuard()
    win32DisableProcessedInput()

    const mode = await Terminal.getTerminalBackgroundColor()

    // Re-clear after getTerminalBackgroundColor() because setRawMode(false)
    // restores the original console mode, including processed input on Windows.
    win32DisableProcessedInput()

    const onExit = async () => {
      unguard?.()
      resolve()
    }

    const onBeforeExit = async () => {
      await TuiPluginRuntime.dispose()
    }

    const renderer = await createCliRenderer(rendererConfig(input.config))

    // CRITICAL: createCliRenderer's internal setupTerminal() enables Kitty keyboard
    // protocol even when useKittyKeyboard: null, because `null ?? {}` = `{}` (truthy).
    // This prevents IME (e.g. Chinese input methods) from working because Kitty encodes
    // all key events as CSI escape sequences that bypass IME composition.
    // We must explicitly disable it after creation.
    renderer.disableKittyKeyboard()

    await render(() => {
      return (
        <ErrorBoundary
          fallback={(error, reset) => (
            <ErrorComponent error={error} reset={reset} onBeforeExit={onBeforeExit} onExit={onExit} mode={mode} />
          )}
        >
          <ArgsProvider {...input.args}>
            <ExitProvider onBeforeExit={onBeforeExit} onExit={onExit}>
              <KVProvider>
                <ToastProvider>
                  <RouteProvider
                    initialRoute={
                      input.args.continue
                        ? {
                            type: "session",
                            sessionID: "dummy",
                          }
                        : undefined
                    }
                  >
                    <TuiConfigProvider config={input.config}>
                      <SDKProvider
                        url={input.url}
                        directory={input.directory}
                        fetch={input.fetch}
                        headers={input.headers}
                        events={input.events}
                      >
                        <ProjectProvider>
                          <SyncProvider>
                            <ThemeProvider mode={mode}>
                              <I18nProvider>
                                <LocalProvider>
                                  <KeybindProvider>
                                    <PromptStashProvider>
                                    <DialogProvider>
                                      <CommandProvider>
                                        <FrecencyProvider>
                                          <PromptHistoryProvider>
                                            <PromptRefProvider>
                                              <App onSnapshot={input.onSnapshot} />
                                            </PromptRefProvider>
                                          </PromptHistoryProvider>
                                        </FrecencyProvider>
                                      </CommandProvider>
                                    </DialogProvider>
                                  </PromptStashProvider>
                                </KeybindProvider>
                                </LocalProvider>
                              </I18nProvider>
                            </ThemeProvider>
                          </SyncProvider>
                        </ProjectProvider>
                      </SDKProvider>
                    </TuiConfigProvider>
                  </RouteProvider>
                </ToastProvider>
              </KVProvider>
            </ExitProvider>
          </ArgsProvider>
        </ErrorBoundary>
      )
    }, renderer)
  })
}

function App(props: { onSnapshot?: () => Promise<string[]> }) {
  const tuiConfig = useTuiConfig()
  const route = useRoute()
  const dimensions = useTerminalDimensions()
  const renderer = useRenderer()
  const dialog = useDialog()
  const local = useLocal()
  const kv = useKV()
  const command = useCommandDialog()
  const keybind = useKeybind()
  const event = useEvent()
  const sdk = useSDK()
  const toast = useToast()
  const i18n = useI18n()
  i18n.initFromKV(kv)
  i18n.setToast(toast)
  const t = i18n.t
  const themeState = useTheme()
  const { theme, mode, setMode, locked, lock, unlock } = themeState
  const sync = useSync()
  const exit = useExit()
  const promptRef = usePromptRef()
  const routes: RouteMap = new Map()
  const [routeRev, setRouteRev] = createSignal(0)
  const routeView = (name: string) => {
    routeRev()
    return routes.get(name)?.at(-1)?.render
  }

  const api = createTuiApi({
    command,
    tuiConfig,
    dialog,
    keybind,
    kv,
    route,
    routes,
    bump: () => setRouteRev((x) => x + 1),
    event,
    sdk,
    sync,
    theme: themeState,
    toast,
    renderer,
  })
  const [ready, setReady] = createSignal(false)
  TuiPluginRuntime.init({
    api,
    config: tuiConfig,
  })
    .catch((error) => {
      console.error("Failed to load TUI plugins", error)
    })
    .finally(() => {
      setReady(true)
    })

  useKeyboard((evt) => {
    if (!Flag.OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT) return
    const sel = renderer.getSelection()
    if (!sel) return

    // Windows Terminal-like behavior:
    // - Ctrl+C copies and dismisses selection
    // - Esc dismisses selection
    // - Most other key input dismisses selection and is passed through
    if (evt.ctrl && evt.name === "c") {
      if (!Selection.copy(renderer, toast)) {
        renderer.clearSelection()
        return
      }

      evt.preventDefault()
      evt.stopPropagation()
      return
    }

    if (evt.name === "escape") {
      renderer.clearSelection()
      evt.preventDefault()
      evt.stopPropagation()
      return
    }

    const focus = renderer.currentFocusedRenderable
    if (focus?.hasSelection() && sel.selectedRenderables.includes(focus)) {
      return
    }

    renderer.clearSelection()
  })

  // Wire up console copy-to-clipboard via opentui's onCopySelection callback
  renderer.console.onCopySelection = async (text: string) => {
    if (!text || text.length === 0) return

    await Clipboard.copy(text)
      .then(() => toast.show({ message: t("tui.app.copiedToClipboard"), variant: "info" }))
      .catch(toast.error)

    renderer.clearSelection()
  }
  const [terminalTitleEnabled, setTerminalTitleEnabled] = createSignal(kv.get("terminal_title_enabled", true))

  // Update terminal window title based on current route and session
  createEffect(() => {
    if (!terminalTitleEnabled() || Flag.OPENCODE_DISABLE_TERMINAL_TITLE) return

    if (route.data.type === "home") {
      renderer.setTerminalTitle(t("tui.app.terminalTitle"))
      return
    }

    if (route.data.type === "session") {
      const session = sync.session.get(route.data.sessionID)
      if (!session || SessionApi.isDefaultTitle(session.title)) {
        renderer.setTerminalTitle(t("tui.app.terminalTitle"))
        return
      }

      const rawTitle = session.title.length > 40 ? session.title.slice(0, 37) + "..." : session.title
      // Strip control characters to prevent ANSI/OSC injection in terminal title
      const title = rawTitle.replace(/[\x00-\x1f\x7f]/g, "")
      renderer.setTerminalTitle(`OC | ${title}`)
      return
    }

    if (route.data.type === "plugin") {
      renderer.setTerminalTitle(`OC | ${route.data.id}`)
    }
  })

  const args = useArgs()
  onMount(() => {
    batch(() => {
      if (args.agent) local.agent.set(args.agent)
      if (args.model) {
        const { providerID, modelID } = Provider.parseModel(args.model)
        if (!providerID || !modelID)
          return toast.show({
            variant: "warning",
            message: `Invalid model format: ${args.model}`,
            duration: 3000,
          })
        local.model.set({ providerID, modelID }, { recent: true })
      }
      if (args.sessionID && !args.fork) {
        route.navigate({
          type: "session",
          sessionID: args.sessionID,
        })
      }
    })
  })

  let continued = false
  createEffect(() => {
    // When using -c, session list is loaded in blocking phase, so we can navigate at "partial"
    if (continued || sync.status === "loading" || !args.continue) return
    const match = sync.data.session
      .toSorted((a, b) => b.time.updated - a.time.updated)
      .find((x) => x.parentID === undefined)?.id
    if (match) {
      continued = true
      if (args.fork) {
        let stale = false
        onCleanup(() => { stale = true })
        void sdk.client.session.fork({ sessionID: match }).then((result) => {
          if (stale) return
          if (result.data?.id) {
            route.navigate({ type: "session", sessionID: result.data.id })
          } else {
            toast.show({ message: t("tui.app.forkSessionFailed"), variant: "error" })
          }
        }).catch(() => {
          if (stale) return
          toast.show({ message: t("tui.app.forkSessionFailed"), variant: "error" })
        })
      } else {
        route.navigate({ type: "session", sessionID: match })
      }
    }
  })

  // Handle --session with --fork: wait for sync to be fully complete before forking
  // (session list loads in non-blocking phase for --session, so we must wait for "complete"
  // to avoid a race where reconcile overwrites the newly forked session)
  let forked = false
  createEffect(() => {
    if (forked || sync.status !== "complete" || !args.sessionID || !args.fork) return
    forked = true
    let stale = false
    onCleanup(() => { stale = true })
    void sdk.client.session.fork({ sessionID: args.sessionID }).then((result) => {
      if (stale) return
      if (result.data?.id) {
        route.navigate({ type: "session", sessionID: result.data.id })
      } else {
        toast.show({ message: t("tui.app.forkSessionFailed"), variant: "error" })
      }
    }).catch(() => {
      if (stale) return
      toast.show({ message: t("tui.app.forkSessionFailed"), variant: "error" })
    })
  })

  createEffect(
    on(
      () => sync.status === "complete" && sync.data.provider.length === 0,
      (isEmpty, wasEmpty) => {
        // only trigger when we transition into an empty-provider state
        if (!isEmpty || wasEmpty) return
        dialog.replace(() => <DialogProviderList />)
      },
    ),
  )

  const connected = useConnected()
  command.register(() => [
    {
      title: t("tui.command.switchSession"),
      value: "session.list",
      keybind: "session_list",
      category: t("tui.category.session"),
      suggested: sync.data.session.length > 0,
      slash: {
        name: "sessions",
        aliases: ["resume", "continue"],
      },
      onSelect: () => {
        dialog.replace(() => <DialogSessionList />)
      },
    },
    {
      title: t("tui.command.newSession"),
      suggested: route.data.type === "session",
      value: "session.new",
      keybind: "session_new",
      category: t("tui.category.session"),
      slash: {
        name: "new",
        aliases: ["clear"],
      },
      onSelect: () => {
        route.navigate({
          type: "home",
        })
        dialog.clear()
      },
    },
    {
      title: t("tui.command.switchModel"),
      value: "model.list",
      keybind: "model_list",
      suggested: true,
      category: t("tui.category.agent"),
      slash: {
        name: "models",
      },
      onSelect: () => {
        dialog.replace(() => <DialogModel />)
      },
    },
    {
      title: t("tui.command.modelCycle"),
      value: "model.cycle_recent",
      keybind: "model_cycle_recent",
      category: t("tui.category.agent"),
      hidden: true,
      onSelect: () => {
        local.model.cycle(1)
      },
    },
    {
      title: t("tui.command.modelCycleReverse"),
      value: "model.cycle_recent_reverse",
      keybind: "model_cycle_recent_reverse",
      category: t("tui.category.agent"),
      hidden: true,
      onSelect: () => {
        local.model.cycle(-1)
      },
    },
    {
      title: t("tui.command.favoriteCycle"),
      value: "model.cycle_favorite",
      keybind: "model_cycle_favorite",
      category: t("tui.category.agent"),
      hidden: true,
      onSelect: () => {
        local.model.cycleFavorite(1)
      },
    },
    {
      title: t("tui.command.favoriteCycleReverse"),
      value: "model.cycle_favorite_reverse",
      keybind: "model_cycle_favorite_reverse",
      category: t("tui.category.agent"),
      hidden: true,
      onSelect: () => {
        local.model.cycleFavorite(-1)
      },
    },
    {
      title: t("tui.command.switchAgent"),
      value: "agent.list",
      keybind: "agent_list",
      category: t("tui.category.agent"),
      slash: {
        name: "agents",
      },
      onSelect: () => {
        dialog.replace(() => <DialogAgent />)
      },
    },
    {
      title: t("tui.command.toggleMcps"),
      value: "mcp.list",
      category: t("tui.category.agent"),
      slash: {
        name: "mcps",
      },
      onSelect: () => {
        dialog.replace(() => <DialogMcp />)
      },
    },
    {
      title: t("tui.command.agentCycle"),
      value: "agent.cycle",
      keybind: "agent_cycle",
      category: t("tui.category.agent"),
      hidden: true,
      onSelect: () => {
        local.agent.move(1)
      },
    },
    {
      title: t("tui.command.variantCycle"),
      value: "variant.cycle",
      keybind: "variant_cycle",
      category: t("tui.category.agent"),
      onSelect: () => {
        local.model.variant.cycle()
      },
    },
    {
      title: t("tui.command.switchModelVariant"),
      value: "variant.list",
      keybind: "variant_list",
      category: t("tui.category.agent"),
      hidden: local.model.variant.list().length === 0,
      slash: {
        name: "variants",
      },
      onSelect: () => {
        dialog.replace(() => <DialogVariant />)
      },
    },
    {
      title: t("tui.command.agentCycleReverse"),
      value: "agent.cycle.reverse",
      keybind: "agent_cycle_reverse",
      category: t("tui.category.agent"),
      hidden: true,
      onSelect: () => {
        local.agent.move(-1)
      },
    },
    {
      title: t("tui.command.connectProvider"),
      value: "provider.connect",
      suggested: !connected(),
      slash: {
        name: "connect",
      },
      onSelect: () => {
        dialog.replace(() => <DialogProviderList />)
      },
      category: t("tui.category.provider"),
    },
    ...(sync.data.console_state.switchableOrgCount > 1
      ? [
          {
            title: t("tui.command.switchOrg"),
            value: "console.org.switch",
            suggested: Boolean(sync.data.console_state.activeOrgName),
            slash: {
              name: "org",
              aliases: ["orgs", "switch-org"],
            },
            onSelect: () => {
              dialog.replace(() => <DialogConsoleOrg />)
            },
            category: t("tui.category.provider"),
          },
        ]
      : []),
    {
      title: t("tui.command.viewStatus"),
      keybind: "status_view",
      value: "opencode.status",
      slash: {
        name: "status",
      },
      onSelect: () => {
        dialog.replace(() => <DialogStatus />)
      },
      category: t("tui.category.system"),
    },
    {
      title: t("tui.command.switchTheme"),
      value: "theme.switch",
      keybind: "theme_list",
      slash: {
        name: "themes",
      },
      onSelect: () => {
        dialog.replace(() => <DialogThemeList />)
      },
      category: t("tui.category.system"),
    },
    {
      title: mode() === "dark" ? t("tui.command.switchToLightMode") : t("tui.command.switchToDarkMode"),
      value: "theme.switch_mode",
      onSelect: (dialog) => {
        setMode(mode() === "dark" ? "light" : "dark")
        dialog.clear()
      },
      category: t("tui.category.system"),
    },
    {
      title: locked() ? t("tui.command.unlockThemeMode") : t("tui.command.lockThemeMode"),
      value: "theme.mode.lock",
      onSelect: (dialog) => {
        if (locked()) unlock()
        else lock()
        dialog.clear()
      },
      category: t("tui.category.system"),
    },
    {
      title: t("tui.command.help"),
      value: "help.show",
      slash: {
        name: "help",
      },
      onSelect: () => {
        dialog.replace(() => <DialogHelp />)
      },
      category: t("tui.category.system"),
    },
    {
      title: t("tui.command.openDocs"),
      value: "docs.open",
      onSelect: () => {
        open("https://opencode.ai/docs").catch(() => {})
        dialog.clear()
      },
      category: t("tui.category.system"),
    },
    {
      title: t("tui.command.exitApp"),
      value: "app.exit",
      slash: {
        name: "exit",
        aliases: ["quit", "q"],
      },
      onSelect: () => exit(),
      category: t("tui.category.system"),
    },
    {
      title: t("tui.command.toggleDebugPanel"),
      category: t("tui.category.system"),
      value: "app.debug",
      onSelect: (dialog) => {
        renderer.toggleDebugOverlay()
        dialog.clear()
      },
    },
    {
      title: t("tui.command.toggleConsole"),
      category: t("tui.category.system"),
      value: "app.console",
      onSelect: (dialog) => {
        renderer.console.toggle()
        dialog.clear()
      },
    },
    {
      title: t("tui.command.writeHeapSnapshot"),
      category: t("tui.category.system"),
      value: "app.heap_snapshot",
      onSelect: async (dialog) => {
        const files = await props.onSnapshot?.()
        toast.show({
          variant: "info",
          message: t("tui.message.heapSnapshotWritten", { files: files?.join(", ") ?? "" }),
          duration: 5000,
        })
        dialog.clear()
      },
    },
    {
      title: t("tui.command.suspendTerminal"),
      value: "terminal.suspend",
      keybind: "terminal_suspend",
      category: t("tui.category.system"),
      hidden: true,
      enabled: tuiConfig.keybinds?.terminal_suspend !== "none",
      onSelect: () => {
        process.once("SIGCONT", () => {
          renderer.resume()
        })

        renderer.suspend()
        // pid=0 means send the signal to all processes in the process group
        process.kill(0, "SIGTSTP")
      },
    },
    {
      title: terminalTitleEnabled() ? t("tui.command.disableTerminalTitle") : t("tui.command.enableTerminalTitle"),
      value: "terminal.title.toggle",
      keybind: "terminal_title_toggle",
      category: t("tui.category.system"),
      onSelect: (dialog) => {
        setTerminalTitleEnabled((prev) => {
          const next = !prev
          kv.set("terminal_title_enabled", next)
          if (!next) renderer.setTerminalTitle("")
          return next
        })
        dialog.clear()
      },
    },
    {
      title: kv.get("animations_enabled", true) ? t("tui.command.disableAnimations") : t("tui.command.enableAnimations"),
      value: "app.toggle.animations",
      category: t("tui.category.system"),
      onSelect: (dialog) => {
        kv.set("animations_enabled", !kv.get("animations_enabled", true))
        dialog.clear()
      },
    },
    {
      title: kv.get("diff_wrap_mode", "word") === "word" ? t("tui.command.disableDiffWrapping") : t("tui.command.enableDiffWrapping"),
      value: "app.toggle.diffwrap",
      category: t("tui.category.system"),
      onSelect: (dialog) => {
        const current = kv.get("diff_wrap_mode", "word")
        kv.set("diff_wrap_mode", current === "word" ? "none" : "word")
        dialog.clear()
      },
    },
    {
      title: t("tui.command.switchLanguage"),
      value: "language.switch",
      slash: {
        name: "lang",
        aliases: ["language", "语言"],
      },
      onSelect: () => {
        i18n.toggleLocale()
      },
      category: t("tui.category.system"),
    },
    {
      title: t("tui.command.diagnostics"),
      value: "opencode.diag",
      slash: {
        name: "diag",
        aliases: ["diagnostics"],
      },
      hidden: true,
      onSelect: () => {
        dialog.replace(() => <DialogDiag />)
      },
      category: t("tui.category.system"),
    },
  ])

  onCleanup(event.on(TuiEvent.CommandExecute.type, (evt) => {
    command.trigger(evt.properties.command)
  }))

  onCleanup(event.on(TuiEvent.ToastShow.type, (evt) => {
    toast.show({
      title: evt.properties.title,
      message: evt.properties.message,
      variant: evt.properties.variant,
      duration: evt.properties.duration,
    })
  }))

  onCleanup(event.on(TuiEvent.SessionSelect.type, (evt) => {
    route.navigate({
      type: "session",
      sessionID: evt.properties.sessionID,
    })
  }))

  onCleanup(event.on("session.deleted", (evt) => {
    if (route.data.type === "session" && route.data.sessionID === evt.properties.info.id) {
      route.navigate({ type: "home" })
      toast.show({
        variant: "info",
        message: t("tui.message.sessionDeleted"),
      })
    }
  }))

  onCleanup(event.on("session.error", (evt) => {
    const error = evt.properties.error
    if (error && typeof error === "object" && error.name === "MessageAbortedError") return
    const message = errorMessage(error)

    toast.show({
      variant: "error",
      message,
      duration: 5000,
    })
  }))

  onCleanup(event.on("installation.update-available", async (evt) => {
    const version = evt.properties.version

    const skipped = kv.get("skipped_version")
    if (skipped && !semver.gt(version, skipped)) return

    const choice = await DialogConfirm.show(
      dialog,
      t("tui.message.updateAvailable"),
      t("tui.message.updateAvailableDesc", { version }),
      "skip",
    )

    if (choice === false) {
      kv.set("skipped_version", version)
      return
    }

    if (choice !== true) return

    toast.show({
      variant: "info",
      message: t("tui.message.updating", { version }),
      duration: 30000,
    })

    const result = await sdk.client.global.upgrade({ target: version })

    if (result.error || !result.data?.success) {
      toast.show({
        variant: "error",
        title: t("tui.message.updateFailed"),
        message: t("tui.message.updateFailedDesc"),
        duration: 10000,
      })
      return
    }

    await DialogAlert.show(
      dialog,
      t("tui.message.updateComplete"),
      t("tui.message.updateCompleteDesc", { version: result.data.version }),
    )

    void exit()
  }))

  const plugin = createMemo(() => {
    if (!ready()) return
    if (route.data.type !== "plugin") return
    const render = routeView(route.data.id)
    if (!render) return <PluginRouteMissing id={route.data.id} onHome={() => route.navigate({ type: "home" })} />
    return render({ params: route.data.data })
  })

  return (
    <box
      width={dimensions().width}
      height={dimensions().height}
      backgroundColor={theme.background}
      onMouseDown={(evt) => {
        if (!Flag.OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT) return
        if (evt.button !== MouseButton.RIGHT) return

        if (!Selection.copy(renderer, toast)) return
        evt.preventDefault()
        evt.stopPropagation()
      }}
      onMouseUp={Flag.OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT ? undefined : () => Selection.copy(renderer, toast)}
    >
      <Show when={Flag.OPENCODE_SHOW_TTFD}>
        <TimeToFirstDraw />
      </Show>
      <Show when={ready()}>
        <ErrorBoundary
          fallback={(error) => (
            <box flexGrow={1} paddingTop={2} paddingLeft={2}>
              <text fg={theme.error}>{errorMessage(error)}</text>
            </box>
          )}
        >
          <Switch>
            <Match when={route.data.type === "home"}>
              <Home />
            </Match>
            <Match when={route.data.type === "session"}>
              <Session />
            </Match>
          </Switch>
        </ErrorBoundary>
      </Show>
      {plugin()}
      <TuiPluginRuntime.Slot name="app" />
      <StartupLoading ready={ready} />
    </box>
  )
}
