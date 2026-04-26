import { createOpencodeClient } from "@opencode-ai/sdk/v2"
import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useRoute } from "@tui/context/route"
import { useSync } from "@tui/context/sync"
import { useProject } from "@tui/context/project"
import { createMemo, createSignal, onMount } from "solid-js"
import { setTimeout as sleep } from "node:timers/promises"
import { errorData, errorMessage } from "@/util/error"
import * as Log from "@/util/log"
import { useSDK } from "../context/sdk"
import { useToast } from "../ui/toast"
import { useI18n } from "../context/i18n"

type Adaptor = {
  type: string
  name: string
  description: string
}

const log = Log.Default.clone().tag("service", "tui-workspace")

function scoped(sdk: ReturnType<typeof useSDK>, sync: ReturnType<typeof useSync>, workspaceID: string) {
  return createOpencodeClient({
    baseUrl: sdk.url,
    fetch: sdk.fetch,
    directory: sync.path.directory || sdk.directory,
    experimental_workspaceID: workspaceID,
  })
}

export async function openWorkspaceSession(input: {
  dialog: ReturnType<typeof useDialog>
  route: ReturnType<typeof useRoute>
  sdk: ReturnType<typeof useSDK>
  sync: ReturnType<typeof useSync>
  toast: ReturnType<typeof useToast>
  t: ReturnType<typeof useI18n>["t"]
  workspaceID: string
}) {
  const client = scoped(input.sdk, input.sync, input.workspaceID)
  log.info("workspace session create requested", {
    workspaceID: input.workspaceID,
  })

  while (true) {
    const result = await client.session.create({ workspace: input.workspaceID }).catch((err) => {
      log.error("workspace session create request failed", {
        workspaceID: input.workspaceID,
        error: errorData(err),
      })
      return undefined
    })
    if (!result) {
      input.toast.show({
        message: input.t("tui.workspace.createFailed"),
        variant: "error",
      })
      return
    }
    log.info("workspace session create response", {
      workspaceID: input.workspaceID,
      status: result.response?.status,
      sessionID: result.data?.id,
    })
    if (result.response?.status && result.response.status >= 500 && result.response.status < 600) {
      log.warn("workspace session create retrying after server error", {
        workspaceID: input.workspaceID,
        status: result.response.status,
      })
      await sleep(1000)
      continue
    }
    if (!result.data) {
      log.error("workspace session create returned no data", {
        workspaceID: input.workspaceID,
        status: result.response?.status,
      })
      input.toast.show({
        message: input.t("tui.workspace.createFailed"),
        variant: "error",
      })
      return
    }

    input.route.navigate({
      type: "session",
      sessionID: result.data.id,
    })
    log.info("workspace session create complete", {
      workspaceID: input.workspaceID,
      sessionID: result.data.id,
    })
    input.dialog.clear()
    return
  }
}

export async function restoreWorkspaceSession(input: {
  dialog: ReturnType<typeof useDialog>
  sdk: ReturnType<typeof useSDK>
  sync: ReturnType<typeof useSync>
  project: ReturnType<typeof useProject>
  toast: ReturnType<typeof useToast>
  t: ReturnType<typeof useI18n>["t"]
  workspaceID: string
  sessionID: string
  done?: () => void
}) {
  log.info("session restore requested", {
    workspaceID: input.workspaceID,
    sessionID: input.sessionID,
  })
  const result = await input.sdk.client.experimental.workspace
    .sessionRestore({ id: input.workspaceID, sessionID: input.sessionID })
    .catch((err) => {
      log.error("session restore request failed", {
        workspaceID: input.workspaceID,
        sessionID: input.sessionID,
        error: errorData(err),
      })
      return undefined
    })
  if (!result?.data) {
    log.error("session restore failed", {
      workspaceID: input.workspaceID,
      sessionID: input.sessionID,
      status: result?.response?.status,
      error: result?.error ? errorData(result.error) : undefined,
    })
    input.toast.show({
      message: `Failed to restore session: ${errorMessage(result?.error ?? "no response")}`,
      variant: "error",
    })
    return
  }

  log.info("session restore response", {
    workspaceID: input.workspaceID,
    sessionID: input.sessionID,
    status: result.response?.status,
    total: result.data.total,
  })

  input.project.workspace.set(input.workspaceID)

  try {
    await input.sync.bootstrap({ fatal: false })
  } catch (e) {}

  await Promise.all([input.project.workspace.sync(), input.sync.session.sync(input.sessionID)]).catch((err) => {
    log.error("session restore refresh failed", {
      workspaceID: input.workspaceID,
      sessionID: input.sessionID,
      error: errorData(err),
    })
    throw err
  })

  log.info("session restore complete", {
    workspaceID: input.workspaceID,
    sessionID: input.sessionID,
    total: result.data.total,
  })

  input.toast.show({
    message: input.t("tui.workspace.restored"),
    variant: "success",
  })
  input.done?.()
  if (input.done) return
  input.dialog.clear()
}

export function DialogWorkspaceCreate(props: { onSelect: (workspaceID: string) => Promise<void> | void }) {
  const dialog = useDialog()
  const sync = useSync()
  const project = useProject()
  const sdk = useSDK()
  const toast = useToast()
  const { t } = useI18n()
  const [creating, setCreating] = createSignal<string>()
  const [adaptors, setAdaptors] = createSignal<Adaptor[]>()

  onMount(() => {
    dialog.setSize("medium")
    void (async () => {
      const dir = sync.path.directory || sdk.directory
      const url = new URL("/experimental/workspace/adaptor", sdk.url)
      if (dir) url.searchParams.set("directory", dir)
      const res = await sdk
        .fetch(url)
        .then((x) => x.json() as Promise<Adaptor[]>)
        .catch(() => undefined)
      if (!res) {
        toast.show({
          message: t("tui.workspace.loadAdaptorsFailed"),
          variant: "error",
        })
        return
      }
      setAdaptors(res)
    })()
  })

  const options = createMemo(() => {
    const type = creating()
    if (type) {
      return [
        {
          title: t("tui.workspace.creating") + ` ${type}...`,
          value: "creating" as const,
          description: t("tui.workspace.remoteDelay"),
        },
      ]
    }
    const list = adaptors()
    if (!list) {
      return [
        {
          title: t("tui.workspace.loading"),
          value: "loading" as const,
          description: t("tui.workspace.fetchingAdaptors"),
        },
      ]
    }
    return list.map((item) => ({
      title: item.name,
      value: item.type,
      description: item.description,
    }))
  })

  const create = async (type: string) => {
    if (creating()) return
    setCreating(type)
    log.info("workspace create requested", {
      type,
    })

    const result = await sdk.client.experimental.workspace.create({ type, branch: null }).catch((err) => {
      toast.show({
        message: t("tui.workspace.creatingFailed"),
        variant: "error",
      })
      log.error("workspace create request failed", {
        type,
        error: errorData(err),
      })
      return undefined
    })

    const workspace = result?.data
    if (!workspace) {
      setCreating(undefined)
      log.error("workspace create failed", {
        type,
        status: result?.response.status,
        error: result?.error ? errorData(result.error) : undefined,
      })
      toast.show({
        message: `Failed to create workspace: ${errorMessage(result?.error ?? "no response")}`,
        variant: "error",
      })
      return
    }
    log.info("workspace create response", {
      type,
      workspaceID: workspace.id,
      status: result.response?.status,
    })

    await project.workspace.sync()
    log.info("workspace create synced", {
      type,
      workspaceID: workspace.id,
    })
    await props.onSelect(workspace.id)
    setCreating(undefined)
  }

  return (
    <DialogSelect
      title={creating() ? t("tui.workspace.creating") : t("tui.workspace.new")}
      skipFilter={true}
      options={options()}
      onSelect={(option) => {
        if (option.value === "creating" || option.value === "loading") return
        void create(option.value)
      }}
    />
  )
}
