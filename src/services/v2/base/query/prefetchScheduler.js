const DEFAULT_BATCH_SIZE = 3
const LOW_MEMORY_BATCH_SIZE = 1
const LOW_MEMORY_THRESHOLD_GB = 4
const IDLE_CALLBACK_TIMEOUT_MS = 5000
const IDLE_FALLBACK_DELAY_MS = 2000
const YIELD_TO_MAIN_DELAY_MS = 0

const SLOW_CONNECTION_TYPES = ['slow-2g', '2g']

const LOAD_EVENT = 'load'
const VISIBILITY_CHANGE_EVENT = 'visibilitychange'
const DOCUMENT_READY_COMPLETE = 'complete'

const isBrowser = () => typeof window !== 'undefined'
const isDocumentAvailable = () => typeof document !== 'undefined'
const isNavigatorAvailable = () => typeof navigator !== 'undefined'

const isDocumentReady = () => document.readyState === DOCUMENT_READY_COMPLETE

const waitForLoad = () =>
  new Promise((resolve) => {
    if (!isDocumentAvailable() || isDocumentReady()) {
      return resolve()
    }
    window.addEventListener(LOAD_EVENT, () => resolve(), { once: true })
  })

const waitForVisible = () =>
  new Promise((resolve) => {
    if (!isDocumentAvailable() || !document.hidden) {
      return resolve()
    }
    const onVisibilityChange = () => {
      if (!document.hidden) {
        document.removeEventListener(VISIBILITY_CHANGE_EVENT, onVisibilityChange)
        resolve()
      }
    }
    document.addEventListener(VISIBILITY_CHANGE_EVENT, onVisibilityChange)
  })

const supportsIdleCallback = () => isBrowser() && 'requestIdleCallback' in window

const scheduleIdleTask = (callback) => {
  if (!isBrowser()) return
  if (supportsIdleCallback()) {
    window.requestIdleCallback(callback, { timeout: IDLE_CALLBACK_TIMEOUT_MS })
  } else {
    setTimeout(callback, IDLE_FALLBACK_DELAY_MS)
  }
}

const isSlowConnection = (connection) =>
  Boolean(connection?.saveData) || SLOW_CONNECTION_TYPES.includes(connection?.effectiveType)

const shouldSkip = () => {
  if (!isNavigatorAvailable()) return false
  return isSlowConnection(navigator.connection)
}

const isLowMemoryDevice = () => {
  if (!isNavigatorAvailable()) return false
  const memory = navigator.deviceMemory
  return Boolean(memory) && memory < LOW_MEMORY_THRESHOLD_GB
}

const pickBatchSize = (requested) => (isLowMemoryDevice() ? LOW_MEMORY_BATCH_SIZE : requested)

const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, YIELD_TO_MAIN_DELAY_MS))

const runInBatches = async (tasks, batchSize) => {
  const pending = [...tasks]

  while (pending.length) {
    const batch = pending.splice(0, batchSize)
    await Promise.allSettled(batch.map((task) => task()))

    if (pending.length) {
      await yieldToMain()
    }
  }
}

export const schedulePrefetch = async (tasks, batchSize = DEFAULT_BATCH_SIZE) => {
  if (!tasks?.length || shouldSkip()) return

  await waitForLoad()
  await waitForVisible()

  scheduleIdleTask(() => runInBatches(tasks, pickBatchSize(batchSize)))
}
