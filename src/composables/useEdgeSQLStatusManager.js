import { ref, computed, onUnmounted } from 'vue'
import * as EdgeSQLService from '@/services/edge-sql-services'

/**
 * Instância global para eventos de operações
 */
const globalEventBus = ref(new Map())

/**
 * Composable otimizado para gerenciar status de databases Edge SQL
 * Implementa sistema de polling eficiente com Promise.all e localStorage
 */
export function useEdgeSQLStatusManager() {
  // Estado local das operações pendentes
  const pendingOperations = ref(new Map())
  const isProcessing = ref(false)
  const intervalRef = ref(null)
  
  // Configurações
  const POLLING_INTERVAL = 3000 // 3 segundos
  const OPERATION_TIMEOUT = 300000 // 5 minutos
  const LOCALSTORAGE_KEY = 'edge-sql-pending-operations'
  
  // Status que indicam operações pendentes
  const PENDING_STATUSES = ['creating', 'deleting', 'pending']
  const COMPLETED_STATUSES = ['created', 'ready', 'deleted']
  const FAILED_STATUSES = ['failed', 'error', 'creation_failed', 'deletion_failed']

  // Callbacks para completamento de operações
  const operationCallbacks = ref(new Map())

  // Estatísticas computadas
  const stats = computed(() => {
    const operations = Array.from(pendingOperations.value.values())
    return {
      total: operations.length,
      creating: operations.filter(op => op.type === 'create').length,
      deleting: operations.filter(op => op.type === 'delete').length,
      pending: operations.filter(op => PENDING_STATUSES.includes(op.status)).length
    }
  })

  const hasPendingOperations = computed(() => stats.value.pending > 0)
  const isEmpty = computed(() => pendingOperations.value.size === 0)

  // Função para emitir eventos globais
  const emitGlobalEvent = (eventType, data) => {
    const listeners = globalEventBus.value.get(eventType) || []
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        // Silently handle listener errors
      }
    })
  }

  // Função para registrar listeners globais
  const onGlobalEvent = (eventType, listener) => {
    if (!globalEventBus.value.has(eventType)) {
      globalEventBus.value.set(eventType, [])
    }
    globalEventBus.value.get(eventType).push(listener)
    
    // Retornar função para remover o listener
    return () => {
      const listeners = globalEventBus.value.get(eventType) || []
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Inicializa o manager carregando operações do localStorage
   */
  function initialize() {
    loadFromLocalStorage()
    
    // Se há operações pendentes, iniciar polling
    if (hasPendingOperations.value) {
      startPolling()
    }
  }

  /**
   * Adiciona uma operação de criação à fila
   */
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

  /**
   * Adiciona uma operação de delete à fila
   */
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

  /**
   * Verifica status de múltiplas operações usando Promise.all
   */
  async function checkAllPendingOperations() {
    const operations = Array.from(pendingOperations.value.values())
      .filter(op => PENDING_STATUSES.includes(op.status))
    
    if (operations.length === 0) {
      stopPolling()
      return []
    }

    // Usar Promise.all para verificar todos os status simultaneamente
    const statusChecks = operations.map(async (operation) => {
      try {
        // Verificar timeout
        const elapsed = Date.now() - operation.startTime
        if (elapsed > OPERATION_TIMEOUT) {
          return {
            operationId: operation.id,
            status: 'failed',
            error: 'Operation timeout',
            operation
          }
        }

        // Usar o serviço específico para verificar status
        const result = await EdgeSQLService.checkDatabaseStatusService(operation.id, 'id,name,status,is_active')
        
        return {
          operationId: operation.id,
          result,
          operation
        }
      } catch (error) {
        return {
          operationId: operation.id,
          error: error.message,
          operation
        }
      }
    })

    const results = await Promise.all(statusChecks)
    const updatedOperations = []

    // Processar resultados
    for (const { operationId, result, error, operation } of results) {
      if (error) {
        // Se é operação de delete e erro 404, considerar como sucesso
        if (operation.type === 'delete' && (error.includes('404') || error.includes('not found'))) {
          completeOperation(operationId, 'deleted')
          updatedOperations.push({ id: operationId, status: 'deleted' })
        } else {
          completeOperation(operationId, 'failed', error)
          updatedOperations.push({ id: operationId, status: 'failed', error })
        }
        continue
      }

      if (!result) continue

      // Processar resposta do serviço
      if (result.statusCode === 200) {
        const newStatus = result.body.status
        
        // Verificar se o status mudou
        if (newStatus !== operation.status) {
          if (COMPLETED_STATUSES.includes(newStatus)) {
            completeOperation(operationId, newStatus)
            updatedOperations.push({ id: operationId, status: newStatus })
          } else if (FAILED_STATUSES.includes(newStatus)) {
            // Tratar status de falha
            completeOperation(operationId, 'failed', `Operation failed with status: ${newStatus}`)
            updatedOperations.push({ id: operationId, status: 'failed', error: newStatus })
          } else {
            // Atualizar status mas manter na fila
            updateOperationStatus(operationId, newStatus)
            updatedOperations.push({ id: operationId, status: newStatus })
          }
        }
      } else if (result.statusCode === 404) {
        // Database não encontrado
        if (operation.type === 'delete') {
          // Para delete, 404 significa sucesso
          completeOperation(operationId, 'deleted')
          updatedOperations.push({ id: operationId, status: 'deleted' })
        } else {
          // Para create, 404 significa falha
          completeOperation(operationId, 'failed', 'Database not found')
          updatedOperations.push({ id: operationId, status: 'failed' })
        }
      }
    }

    saveToLocalStorage()
    return updatedOperations
  }

  /**
   * Atualiza o status de uma operação sem completá-la
   */
  function updateOperationStatus(operationId, newStatus) {
    const operation = pendingOperations.value.get(operationId)
    if (operation) {
      operation.status = newStatus
      operation.lastCheck = Date.now()
    }
  }

  /**
   * Completa uma operação e executa callback
   */
  function completeOperation(operationId, finalStatus, error = null) {
    const operation = pendingOperations.value.get(operationId)
    
    if (operation) {
      // Executar callback se existir
      const callback = operationCallbacks.value.get(operationId)
      if (callback) {
        callback(finalStatus, { ...operation, error })
        operationCallbacks.value.delete(operationId)
      }
      
      // Remover da fila
      pendingOperations.value.delete(operationId)
    }

    // Emitir evento global
    emitGlobalEvent('operationCompleted', { id: operationId, status: finalStatus, error })
  }

  /**
   * Inicia o polling
   */
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
      } catch (error) {
        // Silently handle polling errors to avoid console spam
        // Could be logged to monitoring service in production
      }
    }, POLLING_INTERVAL)
  }

  /**
   * Para o polling
   */
  function stopPolling() {
    if (intervalRef.value) {
      clearInterval(intervalRef.value)
      intervalRef.value = null
      isProcessing.value = false
    }
  }

  /**
   * Salva operações no localStorage
   */
  function saveToLocalStorage() {
    try {
      const operations = Array.from(pendingOperations.value.entries()).map(([id, op]) => [id, op])
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(operations))
    } catch (error) {
      // Silently handle localStorage errors
      // Could be logged to monitoring service in production
    }
  }

  /**
   * Carrega operações do localStorage
   */
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY)
      if (stored) {
        const operations = JSON.parse(stored)
        pendingOperations.value = new Map(operations)
        
        // Remover operações antigas (mais de 1 hora)
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
      // Silently handle localStorage errors and clear operations
      pendingOperations.value.clear()
    }
  }

  /**
   * Limpa todas as operações
   */
  function clearAllOperations() {
    stopPolling()
    pendingOperations.value.clear()
    operationCallbacks.value.clear()
    localStorage.removeItem(LOCALSTORAGE_KEY)
  }

  /**
   * Verifica se um database está pendente
   */
  function isDatabasePending(databaseId) {
    const operation = pendingOperations.value.get(databaseId)
    return operation && PENDING_STATUSES.includes(operation.status)
  }

  /**
   * Obtém operação de um database
   */
  function getDatabaseOperation(databaseId) {
    return pendingOperations.value.get(databaseId)
  }

  /**
   * Força verificação de status de uma operação específica
   */
  async function checkDatabaseStatus(databaseId) {
    const operation = pendingOperations.value.get(databaseId)
    if (!operation || !PENDING_STATUSES.includes(operation.status)) {
      return null
    }

    try {
      const result = await EdgeSQLService.checkDatabaseStatusService(databaseId, 'id,name,status,is_active')
      
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
      if (operation.type === 'delete' && (error.message.includes('404') || error.message.includes('not found'))) {
        completeOperation(databaseId, 'deleted')
        saveToLocalStorage()
        return { id: databaseId, status: 'deleted' }
      }
    }
    
    return null
  }

  // Limpar ao desmontar componente
  onUnmounted(() => {
    stopPolling()
  })

  // Inicializar automaticamente
  initialize()

  return {
    // Estado
    pendingOperations: computed(() => Array.from(pendingOperations.value.values())),
    isProcessing,
    hasPendingOperations,
    isEmpty,
    stats,
    
    // Métodos principais
    addCreateOperation,
    addDeleteOperation,
    checkAllPendingOperations,
    checkDatabaseStatus,
    
    // Verificação de status
    isDatabasePending,
    getDatabaseOperation,
    
    // Controle
    startPolling,
    stopPolling,
    clearAllOperations,
    
    // Constantes
    PENDING_STATUSES,
    COMPLETED_STATUSES,
    FAILED_STATUSES,

    // Eventos globais
    onGlobalEvent
  }
} 