import { ref, computed, onUnmounted } from 'vue'
import { edgeSQLService } from '@/services/v2'

const globalEventBus = ref(new Map())

export function useEdgeSQLStatusManager() {
  const pendingOperations = ref(new Map())
  const isProcessing = ref(false)
  const intervalRef = ref(null)

  const POLLING_INTERVAL = 3000
  const OPERATION_TIMEOUT = 300000
  const LOCALSTORAGE_KEY = 'edge-sql-pending-operations'

  const PENDING_STATUSES = ['creating', 'deleting', 'pending']
  const COMPLETED_STATUSES = ['created', 'ready', 'deleted']
  const FAILED_STATUSES = ['failed', 'error', 'creation_failed', 'deletion_failed']

  const operationCallbacks = ref(new Map())

  const stats = computed(() => {
    const operations = Array.from(pendingOperations.value.values())
    return {
      total: operations.length,
      creating: operations.filter((op) => op.type === 'create').length,
      deleting: operations.filter((op) => op.type === 'delete').length,
      pending: operations.filter((op) => PENDING_STATUSES.includes(op.status)).length
    }
  })

  const hasPendingOperations = computed(() => stats.value.pending > 0)
  const isEmpty = computed(() => pendingOperations.value.size === 0)

  const emitGlobalEvent = (eventType, data) => {
    const listeners = globalEventBus.value.get(eventType) || []
    listeners.forEach((listener) => {
      try {
        listener(data)
        // eslint-disable-next-line no-empty
      } catch (error) {}
    })
  }

  const onGlobalEvent = (eventType, listener) => {
    if (!globalEventBus.value.has(eventType)) {
      globalEventBus.value.set(eventType, [])
    }
    globalEventBus.value.get(eventType).push(listener)

    return () => {
      const listeners = globalEventBus.value.get(eventType) || []
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  function initialize() {
    loadFromLocalStorage()

    if (hasPendingOperations.value) {
      startPolling()
    }
  }

  function addCreateOperation(databaseId, name, onComplete) {
    const operation = {
      id: databaseId,
      type: 'create',
      status: 'creating',
      name,
      startTime: Date.now(),
      lastCheck: Date.now()
    }

    pendingOperations.value.set(databaseId, operation)

    if (onComplete) {
      operationCallbacks.value.set(databaseId, onComplete)
    }

    saveToLocalStorage()
    startPolling()

    return operation
  }

  function addDeleteOperation(databaseId, name, onComplete) {
    const operation = {
      id: databaseId,
      type: 'delete',
      status: 'deleting',
      name,
      startTime: Date.now(),
      lastCheck: Date.now()
    }

    pendingOperations.value.set(databaseId, operation)

    if (onComplete) {
      operationCallbacks.value.set(databaseId, onComplete)
    }

    saveToLocalStorage()
    startPolling()

    return operation
  }

  async function checkAllPendingOperations() {
    const allOperations = Array.from(pendingOperations.value.values())

    if (allOperations.length === 0) {
      stopPolling()
      return []
    }

    const statusChecks = allOperations.map(async (operation) => {
      try {
        const elapsed = Date.now() - operation.startTime
        if (elapsed > OPERATION_TIMEOUT) {
          return {
            operationId: operation.id,
            status: 'failed',
            error: 'Operation timeout',
            operation
          }
        }

        const result = await edgeSQLService.checkDatabaseStatus(
          operation.id,
          'id,name,status,is_active'
        )

        return {
          operationId: operation.id,
          result,
          operation
        }
      } catch (error) {
        return {
          operationId: operation.id,
          error: error.message || error,
          errorObject: error,
          operation
        }
      }
    })

    const results = await Promise.all(statusChecks)
    const updatedOperations = []

    for (const { operationId, result, error, errorObject, operation } of results) {
      if (error) {
        const errorStr = Array.isArray(error)
          ? error.join(' ')
          : typeof error === 'string'
          ? error
          : JSON.stringify(error)

        const is404Error =
          operation.type === 'delete' &&
          (errorStr.includes('404') ||
            errorStr.toLowerCase().includes('not found') ||
            errorObject?.status === 404 ||
            errorObject?.response?.status === 404 ||
            (errorObject?.message &&
              (errorObject.message.includes('404') ||
                errorObject.message.toLowerCase().includes('not found'))))

        if (is404Error) {
          completeOperation(operationId, 'deleted')
          updatedOperations.push({ id: operationId, status: 'deleted' })
        } else {
          completeOperation(operationId, 'failed', error)
          updatedOperations.push({ id: operationId, status: 'failed', error })
        }
        continue
      }

      if (!result) continue

      if (result.statusCode === 200) {
        const newStatus = result.body.status

        if (newStatus !== operation.status) {
          if (COMPLETED_STATUSES.includes(newStatus)) {
            completeOperation(operationId, newStatus)
            updatedOperations.push({ id: operationId, status: newStatus })
          } else if (FAILED_STATUSES.includes(newStatus)) {
            completeOperation(operationId, 'failed', `Operation failed with status: ${newStatus}`)
            updatedOperations.push({ id: operationId, status: 'failed', error: newStatus })
          } else {
            updateOperationStatus(operationId, newStatus)
            updatedOperations.push({ id: operationId, status: newStatus })
          }
        }
      } else if (result.statusCode === 404) {
        if (operation.type === 'delete') {
          completeOperation(operationId, 'deleted')
          updatedOperations.push({ id: operationId, status: 'deleted' })
        } else {
          completeOperation(operationId, 'failed', 'Database not found')
          updatedOperations.push({ id: operationId, status: 'failed' })
        }
      }
    }

    saveToLocalStorage()
    return updatedOperations
  }

  function updateOperationStatus(operationId, newStatus) {
    const operation = pendingOperations.value.get(operationId)
    if (operation) {
      operation.status = newStatus
      operation.lastCheck = Date.now()
    }
  }

  function completeOperation(operationId, finalStatus, error = null) {
    const operation = pendingOperations.value.get(operationId)

    if (operation) {
      const callback = operationCallbacks.value.get(operationId)
      if (callback) {
        callback(finalStatus, { ...operation, error })
        operationCallbacks.value.delete(operationId)
      }
      pendingOperations.value.delete(operationId)
    }

    emitGlobalEvent('operationCompleted', { id: operationId, status: finalStatus, error })
  }

  function startPolling() {
    if (intervalRef.value || !hasPendingOperations.value) {
      return
    }

    isProcessing.value = true

    intervalRef.value = setInterval(async () => {
      if (!hasPendingOperations.value) {
        stopPolling()
        return
      }

      try {
        await checkAllPendingOperations()
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }, POLLING_INTERVAL)
  }

  function stopPolling() {
    if (intervalRef.value) {
      clearInterval(intervalRef.value)
      intervalRef.value = null
      isProcessing.value = false
    }
  }

  function saveToLocalStorage() {
    try {
      const operations = Array.from(pendingOperations.value.entries()).map(([id, op]) => [id, op])
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(operations))
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY)
      if (stored) {
        const operations = JSON.parse(stored)
        pendingOperations.value = new Map(operations)

        const now = Date.now()
        const oneHour = 60 * 60 * 1000
        for (const [id, operation] of pendingOperations.value.entries()) {
          if (now - operation.startTime > oneHour) {
            pendingOperations.value.delete(id)
          }
        }

        saveToLocalStorage()
      }
    } catch (error) {
      pendingOperations.value.clear()
    }
  }

  function clearAllOperations() {
    stopPolling()
    pendingOperations.value.clear()
    operationCallbacks.value.clear()
    localStorage.removeItem(LOCALSTORAGE_KEY)
  }

  function isDatabasePending(databaseId) {
    const operation = pendingOperations.value.get(databaseId)
    return operation && PENDING_STATUSES.includes(operation.status)
  }

  function getDatabaseOperation(databaseId) {
    return pendingOperations.value.get(databaseId)
  }

  async function checkDatabaseStatus(databaseId) {
    const operation = pendingOperations.value.get(databaseId)
    if (!operation || !PENDING_STATUSES.includes(operation.status)) {
      return null
    }

    try {
      const result = await edgeSQLService.checkDatabaseStatus(
        databaseId,
        'id,name,status,is_active'
      )

      if (result.statusCode === 200) {
        const newStatus = result.body.status

        if (COMPLETED_STATUSES.includes(newStatus)) {
          completeOperation(databaseId, newStatus)
          saveToLocalStorage()
          return { id: databaseId, status: newStatus }
        } else if (newStatus !== operation.status) {
          updateOperationStatus(databaseId, newStatus)
          saveToLocalStorage()
          return { id: databaseId, status: newStatus }
        }
      } else if (result.statusCode === 404) {
        const finalStatus = operation.type === 'delete' ? 'deleted' : 'failed'
        completeOperation(databaseId, finalStatus)
        saveToLocalStorage()
        return { id: databaseId, status: finalStatus }
      }
    } catch (error) {
      const errorMsg = Array.isArray(error.message) ? error.message.join(' ') : error.message

      const is404Error =
        operation.type === 'delete' &&
        ((errorMsg && (errorMsg.includes('404') || errorMsg.toLowerCase().includes('not found'))) ||
          error.status === 404 ||
          error.response?.status === 404)

      if (is404Error) {
        completeOperation(databaseId, 'deleted')
        saveToLocalStorage()
        return { id: databaseId, status: 'deleted' }
      }
    }

    return null
  }

  onUnmounted(() => {
    stopPolling()
  })

  initialize()

  return {
    pendingOperations: computed(() => Array.from(pendingOperations.value.values())),
    isProcessing,
    hasPendingOperations,
    isEmpty,
    stats,
    addCreateOperation,
    addDeleteOperation,
    checkAllPendingOperations,
    checkDatabaseStatus,
    isDatabasePending,
    getDatabaseOperation,
    startPolling,
    stopPolling,
    clearAllOperations,
    PENDING_STATUSES,
    COMPLETED_STATUSES,
    FAILED_STATUSES,
    onGlobalEvent
  }
}
