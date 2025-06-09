import { ref, computed, onUnmounted } from 'vue'

/**
 * Composable para gerenciar fila de operações pendentes
 * Monitora operações assíncronas e faz polling até conclusão
 */
export function useOperationQueue() {
  const queue = ref(new Map())
  const isProcessing = ref(false)
  const intervalRef = ref(null)
  const callbacks = ref({})
  
  const POLLING_INTERVAL = 3000 // 3 segundos
  const OPERATION_TIMEOUT = 300000 // 5 minutos

  // Status que indicam operações pendentes
  const PENDING_STATUSES = ['creating', 'deleting', 'pending', 'processing']
  const COMPLETED_STATUSES = ['created', 'ready', 'completed', 'deleted']
  const FAILED_STATUSES = ['failed', 'error', 'deletion_failed']

  // Estatísticas da fila
  const stats = computed(() => ({
    total: queue.value.size,
    pending: Array.from(queue.value.values()).filter(op => PENDING_STATUSES.includes(op.status)).length,
    completed: Array.from(queue.value.values()).filter(op => COMPLETED_STATUSES.includes(op.status)).length,
    failed: Array.from(queue.value.values()).filter(op => FAILED_STATUSES.includes(op.status)).length
  }))

  const hasPendingOperations = computed(() => stats.value.pending > 0)
  const isEmpty = computed(() => queue.value.size === 0)

  /**
   * Adiciona uma operação à fila
   * @param {string} id - ID único da operação
   * @param {string} type - Tipo da operação (create, delete, etc.)
   * @param {string} status - Status inicial
   * @param {Object} metadata - Dados adicionais da operação
   */
  function addOperation(id, type, status, metadata = {}) {
    const operation = {
      id,
      type,
      status,
      metadata,
      startTime: Date.now(),
      lastCheck: Date.now(),
      retries: 0,
      maxRetries: 3
    }
    
    queue.value.set(id, operation)
    
    // Iniciar polling se não estiver rodando e status é pendente
    if (!intervalRef.value && PENDING_STATUSES.includes(status)) {
      startPolling()
    }
    
    return operation
  }

  /**
   * Atualiza o status de uma operação
   * @param {string} id - ID da operação
   * @param {string} status - Novo status
   * @param {Object} metadata - Metadados atualizados
   */
  function updateOperation(id, status, metadata = {}) {
    const operation = queue.value.get(id)
    if (!operation) {
      return null
    }

    operation.status = status
    operation.lastCheck = Date.now()
    operation.metadata = { ...operation.metadata, ...metadata }
    
    // Se completou ou falhou, remover da fila imediatamente
    if (COMPLETED_STATUSES.includes(status) || FAILED_STATUSES.includes(status)) {
      queue.value.delete(id)
      executeCallback(id, status, operation)
      
      // Se não há mais operações pendentes, parar polling
      const remainingPending = Array.from(queue.value.values())
        .filter(op => PENDING_STATUSES.includes(op.status))
      
      if (remainingPending.length === 0) {
        stopPolling()
      }
    }
    
    return operation
  }

  /**
   * Remove uma operação da fila
   * @param {string} id - ID da operação
   */
  function removeOperation(id) {
    const operation = queue.value.get(id)
    queue.value.delete(id)
    return operation
  }

  /**
   * Registra callback para quando operação completar
   * @param {string} id - ID da operação
   * @param {Function} callback - Função a ser executada
   */
  function onOperationComplete(id, callback) {
    callbacks.value[id] = callback
  }

  /**
   * Executa callback registrado
   * @param {string} id - ID da operação
   * @param {string} status - Status final
   * @param {Object} operation - Dados da operação
   */
  function executeCallback(id, status, operation) {
    const callback = callbacks.value[id]
    if (callback && typeof callback === 'function') {
      callback(status, operation)
      delete callbacks.value[id]
    }
  }

  /**
   * Inicia o polling das operações pendentes
   */
  function startPolling() {
    if (intervalRef.value) {
      return
    }
    
    isProcessing.value = true
    intervalRef.value = setInterval(async () => {
      // Verificar novamente se há operações pendentes (pode ter mudado durante o intervalo)
      const pendingOps = Array.from(queue.value.values())
        .filter(op => PENDING_STATUSES.includes(op.status))
      
      if (pendingOps.length === 0) {
        stopPolling()
        return
      }

      // Processar operações pendentes sequencialmente
      for (const operation of pendingOps) {
        // Verificar se ainda existe antes de processar
        if (queue.value.has(operation.id)) {
          await checkOperationStatus(operation)
          
          // Verificar se o polling deve parar após cada operação
          const currentPending = Array.from(queue.value.values())
            .filter(op => PENDING_STATUSES.includes(op.status))
          
          if (currentPending.length === 0) {
            stopPolling()
            return
          }
        }
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
   * Verifica status de uma operação específica
   * @param {Object} operation - Operação a verificar
   */
  async function checkOperationStatus(operation) {
    // Verificar se a operação ainda existe na fila antes de processar
    if (!queue.value.has(operation.id)) {
      return
    }

    // Verificar timeout
    const elapsed = Date.now() - operation.startTime
    if (elapsed > OPERATION_TIMEOUT) {
      updateOperation(operation.id, 'failed', { 
        ...operation.metadata, 
        error: 'Operation timeout' 
      })
      return
    }

    // Buscar o status checker apropriado
    const checker = statusCheckers.value[operation.type]
    if (!checker) {
      updateOperation(operation.id, 'failed', { 
        ...operation.metadata, 
        error: 'No status checker available' 
      })
      return
    }

    try {
      // Verificar novamente se a operação ainda existe após operações async
      if (!queue.value.has(operation.id)) {
        return
      }

      const result = await checker(operation.id, operation.metadata)
      
      // Verificar novamente se a operação ainda existe após o checker
      if (!queue.value.has(operation.id)) {
        return
      }

      if (result && result.status) {
        updateOperation(operation.id, result.status, result.metadata || operation.metadata)
      }
    } catch (error) {
      // Verificar uma última vez se a operação ainda existe
      if (queue.value.has(operation.id)) {
        updateOperation(operation.id, 'failed', { 
          ...operation.metadata, 
          error: error.message 
        })
      }
    }
  }

  // Armazenar status checkers registrados
  const statusCheckers = ref({})

  /**
   * Busca um status checker por tipo
   * @param {string} type - Tipo da operação
   * @returns {Function|null} - Status checker ou null
   */
  function getStatusChecker(type) {
    return statusCheckers.value[type] || null
  }

  /**
   * Registra um status checker para um tipo de operação
   * @param {string} type - Tipo da operação
   * @param {Function} checker - Função que verifica o status
   */
  function registerStatusChecker(type, checker) {
    statusCheckers.value[type] = checker
  }

  /**
   * Limpa todas as operações da fila
   */
  function clearQueue() {
    stopPolling()
    queue.value.clear()
    callbacks.value = {}
  }

  /**
   * Obtém operações por tipo
   * @param {string} type - Tipo da operação
   * @returns {Array} - Lista de operações
   */
  function getOperationsByType(type) {
    return Array.from(queue.value.values()).filter(op => op.type === type)
  }

  /**
   * Obtém uma operação específica por ID
   * @param {string} id - ID da operação
   * @returns {Object|null} - Operação ou null
   */
  function getOperation(id) {
    return queue.value.get(id) || null
  }

  // Limpeza ao desmontar componente
  onUnmounted(() => {
    clearQueue()
  })

  return {
    // Estado reativo
    queue: computed(() => Array.from(queue.value.values())),
    stats,
    hasPendingOperations,
    isEmpty,
    isProcessing,
    
    // Constantes
    PENDING_STATUSES,
    COMPLETED_STATUSES,
    FAILED_STATUSES,
    
    // Métodos principais
    addOperation,
    updateOperation,
    removeOperation,
    clearQueue,
    
    // Status checkers
    registerStatusChecker,
    getStatusChecker,
    
    // Callbacks
    onOperationComplete,
    
    // Polling
    startPolling,
    stopPolling,
    
    // Utilidades
    getOperation,
    getOperationsByType
  }
} 