import { computed, ref } from 'vue'

export const DEPLOY_ITEM_STATUS = {
  DEPLOYING: 'deploying',
  DONE: 'done',
  FAILED: 'failed',
  SKIPPED: 'skipped'
}

export function useReleaseDeployProgress({ dispatch, resolveRow } = {}) {
  const visible = ref(false)
  const isRunning = ref(false)
  const items = ref([])

  const seedRow = (id) => {
    const meta = (typeof resolveRow === 'function' ? resolveRow(id) : null) ?? {}
    return {
      id: String(id),
      name: meta.name ?? String(id),
      environmentNames: Array.isArray(meta.environmentNames) ? meta.environmentNames : [],
      policyLabel: meta.policyLabel ?? null,
      status: DEPLOY_ITEM_STATUS.DEPLOYING,
      error: null,
      errorType: null,
      skipReason: null,
      traceId: null
    }
  }

  const statusFor = (outcome) => {
    if (outcome.skipped) return DEPLOY_ITEM_STATUS.SKIPPED
    return outcome.ok ? DEPLOY_ITEM_STATUS.DONE : DEPLOY_ITEM_STATUS.FAILED
  }

  const applyOutcome = (outcome) => {
    if (!outcome) return
    const targetId = String(outcome.id)
    items.value = items.value.map((item) =>
      item.id === targetId
        ? {
            ...item,
            status: statusFor(outcome),
            error: outcome.error ?? null,
            errorType: outcome.errorType ?? null,
            skipReason: outcome.skipReason ?? null,
            traceId: outcome.traceId ?? null
          }
        : item
    )
  }

  const dispatchIds = async (ids) => {
    if (typeof dispatch !== 'function') return
    isRunning.value = true
    try {
      await dispatch(ids, applyOutcome)
    } finally {
      isRunning.value = false
    }
  }

  const run = async (ids) => {
    const list = (Array.isArray(ids) ? ids : []).map(String).filter(Boolean)
    items.value = list.map(seedRow)
    visible.value = true
    if (!list.length) {
      isRunning.value = false
      return
    }
    await dispatchIds(list)
  }

  const retryFailed = async () => {
    const failedIds = items.value
      .filter((item) => item.status === DEPLOY_ITEM_STATUS.FAILED)
      .map((item) => item.id)
    if (!failedIds.length) return
    const failedSet = new Set(failedIds)
    items.value = items.value.map((item) =>
      failedSet.has(item.id)
        ? {
            ...item,
            status: DEPLOY_ITEM_STATUS.DEPLOYING,
            error: null,
            errorType: null,
            skipReason: null,
            traceId: null
          }
        : item
    )
    await dispatchIds(failedIds)
  }

  const close = () => {
    visible.value = false
    items.value = []
    isRunning.value = false
  }

  const counts = computed(() => {
    let inProgress = 0
    let done = 0
    let failed = 0
    items.value.forEach((item) => {
      if (item.status === DEPLOY_ITEM_STATUS.DONE) done += 1
      else if (item.status === DEPLOY_ITEM_STATUS.DEPLOYING) inProgress += 1
      else failed += 1
    })
    return {
      total: items.value.length,
      inProgress,
      done,
      failed,
      settled: done + failed
    }
  })

  const activeName = computed(
    () => items.value.find((item) => item.status === DEPLOY_ITEM_STATUS.DEPLOYING)?.name ?? null
  )

  return {
    visible,
    isRunning,
    items,
    counts,
    activeName,
    run,
    retryFailed,
    close
  }
}
