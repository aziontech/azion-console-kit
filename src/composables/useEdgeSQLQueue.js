import { computed, ref } from 'vue'
import { useOperationQueue } from './useOperationQueue'
import * as EdgeSQLService from '@/services/edge-sql-services'

/**
 * Composable específico para gerenciar operações Edge SQL
 * Integra o sistema de fila com os serviços de database
 */
export function useEdgeSQLQueue() {
  const {
    queue,
    isProcessing,
    hasPendingOperations,
    isEmpty,
    stats,
    addOperation,
    updateOperation,
    removeOperation,
    getOperation,
    onOperationComplete,
    registerStatusChecker,
    clearQueue,
    startPolling,
    stopPolling,
    PENDING_STATUSES,
    COMPLETED_STATUSES,
    FAILED_STATUSES
  } = useOperationQueue()

  // Referência para função de reload da lista
  const reloadListFunction = ref(null)

  // Estatísticas específicas para Edge SQL
  const sqlStats = computed(() => ({
    ...stats.value,
    creating: queue.value.filter(op => op.type === 'create' && op.status === 'creating').length,
    deleting: queue.value.filter(op => op.type === 'delete' && op.status === 'deleting').length
  }))

  // Registrar checkers de status para operações Edge SQL
  registerStatusChecker('create', async (databaseId, metadata) => {
    try {
      const result = await EdgeSQLService.getDatabaseService(databaseId)
      
      if (result.statusCode === 200) {
        const status = result.body.status
        return { status, metadata: { ...metadata, database: result.body } }
      } else if (result.statusCode === 404) {
        // Database não encontrado durante criação = falha
        return { status: 'failed', metadata: { ...metadata, error: 'Database not found' } }
      } else if (result.statusCode === 500 && result.body?.errors) {
        // Verificar se há erro 404 no array de erros
        const has404Error = result.body.errors.some(error => 
          error.status === '404' || error.code === '10004' || 
          error.title === 'Not Found' || error.detail === 'Not found.'
        )
        
        if (has404Error) {
          return { status: 'failed', metadata: { ...metadata, error: 'Database not found' } }
        }
      }
      
      return null
    } catch (error) {
      return { status: 'failed', metadata: { ...metadata, error: error.message } }
    }
  })

  registerStatusChecker('delete', async (databaseId, metadata) => {
    try {
      const result = await EdgeSQLService.getDatabaseService(databaseId)
      
      if (result.statusCode === 404) {
        // Database deletado - polling individual detectou, não precisa reload da lista
        return { status: 'deleted', metadata }
      } else if (result.statusCode === 500 && result.body === null) {
        // API retorna 500 com body null quando database não existe (404 mascarado)
        return { status: 'deleted', metadata }
      } else if (result.statusCode === 200) {
        const apiStatus = result.body.status
        
        if (apiStatus === 'deleting') {
          return { status: 'deleting', metadata: { ...metadata, database: result.body } }
        } else {
          return { status: 'deleting', metadata: { ...metadata, database: result.body } }
        }
      } else if (result.statusCode === 500 && result.body?.errors) {
        // Verificar se há erro 404 no array de erros
        const has404Error = result.body.errors.some(error => 
          error.status === '404' || error.code === '10004' || 
          error.title === 'Not Found' || error.detail === 'Not found.'
        )
        
        if (has404Error) {
          return { status: 'deleted', metadata }
        }
      }
      return null
    } catch (error) {
      // Verificar diferentes formatos de erro 404
      const errorString = error.message?.toLowerCase() || ''
      const isNotFound = errorString.includes('not found') || 
                        errorString.includes('404') || 
                        errorString.includes('database not found')
      
      if (isNotFound) {
        return { status: 'deleted', metadata }
      }
      
      return { status: 'failed', metadata: { ...metadata, error: error.message } }
    }
  })

  /**
   * Adiciona uma operação de criação de database à fila
   * @param {string} databaseId - ID do database
   * @param {string} name - Nome do database
   * @param {Function} onComplete - Callback quando completar
   */
  function addCreateOperation(databaseId, name, onComplete) {
    const operation = addOperation(databaseId, 'create', 'creating', { name })
    
    if (onComplete) {
      onOperationComplete(databaseId, (status, operation) => {
        onComplete(status, operation)
      })
    }
    
    return operation
  }

  /**
   * Adiciona uma operação de delete de database à fila
   * @param {string} databaseId - ID do database
   * @param {string} name - Nome do database
   * @param {Function} onComplete - Callback quando completar
   */
  function addDeleteOperation(databaseId, name, onComplete) {
    const operation = addOperation(databaseId, 'delete', 'deleting', { name })
    
    if (onComplete) {
      onOperationComplete(databaseId, (status, operation) => {
        onComplete(status, operation)
      })
    }
    
    return operation
  }

  /**
   * Verifica se um database específico está na fila
   * @param {string} databaseId - ID do database
   * @returns {Object|null} - Operação ou null
   */
  function getDatabaseOperation(databaseId) {
    return getOperation(databaseId)
  }

  /**
   * Obtém todas as operações de criação pendentes
   * @returns {Array} - Lista de operações de criação
   */
  function getCreateOperations() {
    return queue.value.filter(op => op.type === 'create' && PENDING_STATUSES.includes(op.status))
  }

  /**
   * Obtém todas as operações de delete pendentes
   * @returns {Array} - Lista de operações de delete
   */
  function getDeleteOperations() {
    return queue.value.filter(op => op.type === 'delete' && PENDING_STATUSES.includes(op.status))
  }

  /**
   * Verifica se há operações pendentes para um database
   * @param {string} databaseId - ID do database
   * @returns {boolean} - True se há operações pendentes
   */
  function isDatabasePending(databaseId) {
    const operation = getOperation(databaseId)
    return operation && PENDING_STATUSES.includes(operation.status)
  }

  /**
   * Obtém o status de uma operação de database
   * @param {string} databaseId - ID do database
   * @returns {string|null} - Status da operação ou null
   */
  function getDatabaseStatus(databaseId) {
    const operation = getOperation(databaseId)
    return operation ? operation.status : null
  }

  /**
   * Força a verificação de status de uma operação específica
   * @param {string} databaseId - ID do database
   * @returns {Promise<boolean>} - True se a operação foi atualizada
   */
  async function checkDatabaseStatus(databaseId) {
    const operation = getOperation(databaseId)
    if (!operation) return false

    try {
      const result = await EdgeSQLService.getDatabaseService(databaseId)
      if (result.statusCode === 200) {
        const newStatus = result.body.status
        if (newStatus !== operation.status) {
          updateOperation(databaseId, newStatus, { 
            ...operation.metadata, 
            database: result.body 
          })
          return true
        }
      } else if (result.statusCode === 404 && operation.type === 'delete') {
        updateOperation(databaseId, 'deleted', operation.metadata)
        return true
      }
    } catch (error) {
      if (operation.type === 'delete' && error.message.includes('not found')) {
        updateOperation(databaseId, 'deleted', operation.metadata)
        return true
      }
    }
    
    return false
  }

  /**
   * Obtém um resumo visual das operações para o UI
   * @returns {Object} - Resumo com ícones e textos
   */
  function getQueueSummary() {
    const creating = sqlStats.value.creating
    const deleting = sqlStats.value.deleting
    const total = creating + deleting

    if (total === 0) {
      return {
        status: 'idle',
        icon: 'pi pi-check-circle',
        text: 'All operations complete',
        color: 'text-green-600',
        severity: 'success'
      }
    }

    if (isProcessing.value) {
      return {
        status: 'processing',
        icon: 'pi pi-spin pi-spinner',
        text: `Processing ${total} operation${total > 1 ? 's' : ''}...`,
        color: 'text-blue-600',
        severity: 'info'
      }
    }

    return {
      status: 'pending',
      icon: 'pi pi-clock',
      text: `${creating} creating, ${deleting} deleting`,
      color: 'text-yellow-600',
      severity: 'warning'
    }
  }

  /**
   * Configura a função de reload da lista
   * @param {Function} reloadFn - Função para recarregar a lista
   */
  function setReloadFunction(reloadFn) {
    reloadListFunction.value = reloadFn
  }

  return {
    // Estado
    queue,
    isProcessing,
    hasPendingOperations,
    isEmpty,
    stats: sqlStats,
    
    // Métodos específicos do Edge SQL
    addCreateOperation,
    addDeleteOperation,
    getDatabaseOperation,
    getCreateOperations,
    getDeleteOperations,
    isDatabasePending,
    getDatabaseStatus,
    checkDatabaseStatus,
    getQueueSummary,
    
    // Configuração
    setReloadFunction,
    
    // Métodos básicos
    updateOperation,
    removeOperation,
    clearQueue,
    startPolling,
    stopPolling,
    
    // Constantes
    PENDING_STATUSES,
    COMPLETED_STATUSES,
    FAILED_STATUSES
  }
} 