/**
 * Query Key Factory Pattern com Reatividade Automática
 *
 * Este factory cria query keys reativas que funcionam automaticamente
 * com computed() e ref() do Vue, eliminando a necessidade de usar unref() manualmente.
 *
 * Benefícios:
 * - Reatividade automática com computed/ref
 * - Estrutura hierárquica consistente
 * - Fácil invalidação de cache
 * - API simples e intuitiva
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

import { unref } from 'vue'

/**
 * Normaliza valores reativos (ref/computed) para valores primitivos
 * @private
 */
function unwrapReactive(value) {
  if (value === null || value === undefined) {
    return value
  }

  // Se for objeto, unwrap cada propriedade
  if (typeof value === 'object' && !Array.isArray(value)) {
    const unwrapped = {}
    for (const key in value) {
      unwrapped[key] = unref(value[key])
    }
    return unwrapped
  }

  // Para valores primitivos e arrays, apenas unref
  return unref(value)
}

/**
 * Cria um query key factory para uma feature
 *
 * @param {string} feature - Nome da feature (ex: 'users', 'products', 'solutions')
 * @returns {Object} Query key factory com métodos hierárquicos
 *
 * @example
 * const userKeys = createQueryKeyFactory('users')
 *
 * // Uso básico:
 * userKeys.all                          // ['users']
 * userKeys.lists()                      // ['users', 'list']
 * userKeys.list({ role: 'admin' })      // ['users', 'list', { role: 'admin' }]
 * userKeys.details()                    // ['users', 'detail']
 * userKeys.detail(123)                  // ['users', 'detail', 123]
 *
 * // Com reatividade automática:
 * const roleRef = ref('admin')
 * userKeys.list({ role: roleRef })      // Automático unref!
 * // ['users', 'list', { role: 'admin' }]
 *
 * // Invalidação:
 * invalidateQueries({ queryKey: userKeys.all })        // Todas as queries
 * invalidateQueries({ queryKey: userKeys.lists() })    // Todas as listas
 * invalidateQueries({ queryKey: userKeys.details() })  // Todos os detalhes
 */
export function createQueryKeyFactory(feature) {
  return {
    /**
     * Base key para todas as queries desta feature
     * Use para invalidar TUDO relacionado a esta feature
     */
    all: [feature],

    /**
     * Base key para todas as queries de lista
     * Use para invalidar todas as listas (independente dos filtros)
     */
    lists: () => [feature, 'list'],

    /**
     * Query key para lista com filtros
     * Reatividade automática - aceita ref/computed
     *
     * @param {Object} filters - Filtros da query (aceita ref/computed)
     * @returns {Array} Query key
     */
    list: (filters = {}) => [feature, 'list', unwrapReactive(filters)],

    /**
     * Base key para todas as queries de detalhe
     * Use para invalidar todos os detalhes (independente do ID)
     */
    details: () => [feature, 'detail'],

    /**
     * Query key para detalhe específico
     * Reatividade automática - aceita ref/computed
     *
     * @param {string|number|Ref} id - ID do recurso (aceita ref/computed)
     * @returns {Array} Query key
     */
    detail: (id) => [feature, 'detail', unwrapReactive(id)],

    /**
     * Query key para tabs/abas
     * Útil para interfaces com múltiplas abas que carregam dados diferentes
     *
     * @param {string|Ref} tabName - Nome da aba (aceita ref/computed)
     * @param {Object} filters - Filtros adicionais (aceita ref/computed)
     * @returns {Array} Query key
     *
     * @example
     * // Componente com abas
     * const activeTab = ref('overview')
     * const tabKey = appKeys.tab(activeTab)
     * // ['applications', 'tab', 'overview']
     *
     * // Com filtros
     * const tabKey = appKeys.tab('metrics', { period: '7d' })
     * // ['applications', 'tab', 'metrics', { period: '7d' }]
     */
    tab: (tabName, filters = {}) => {
      const unwrappedFilters = unwrapReactive(filters)
      const unwrappedTab = unwrapReactive(tabName)

      // Se tem filtros, inclui na key
      if (Object.keys(unwrappedFilters).length > 0) {
        return [feature, 'tab', unwrappedTab, unwrappedFilters]
      }

      return [feature, 'tab', unwrappedTab]
    },

    /**
     * Query key para paginação infinita
     *
     * @param {Object} filters - Filtros da query (aceita ref/computed)
     * @returns {Array} Query key
     */
    infinite: (filters = {}) => [feature, 'infinite', unwrapReactive(filters)]
  }
}

/**
 * Cria um query key factory customizado com métodos adicionais
 *
 * @param {string} feature - Nome da feature
 * @param {Object} customMethods - Métodos customizados específicos da feature
 * @returns {Object} Query key factory estendido
 *
 * @example
 * const edgeFunctionKeys = createCustomQueryKeyFactory('edge-functions', {
 *   // Métodos customizados
 *   byEnvironment: (env) => ['edge-functions', 'by-environment', unwrapReactive(env)],
 *   active: () => ['edge-functions', 'active']
 * })
 *
 * // Uso com reatividade
 * const environment = ref('edge')
 * edgeFunctionKeys.byEnvironment(environment)
 * // ['edge-functions', 'by-environment', 'edge']
 */
export function createCustomQueryKeyFactory(feature, customMethods = {}) {
  const baseFactory = createQueryKeyFactory(feature)

  // Garante que métodos customizados também lidem com reatividade
  const wrappedCustomMethods = {}
  for (const [methodName, method] of Object.entries(customMethods)) {
    wrappedCustomMethods[methodName] = (...args) => {
      const unwrappedArgs = args.map(unwrapReactive)
      return method(...unwrappedArgs)
    }
  }

  return {
    ...baseFactory,
    ...wrappedCustomMethods
  }
}

/**
 * Valida uma query key
 * Útil para debugging e garantir que as keys seguem as melhores práticas
 *
 * @param {Array} queryKey - Query key para validar
 * @returns {Object} Resultado da validação
 *
 * @example
 * validateQueryKey(['users', 'list', { role: 'admin' }])
 * // { valid: true, warnings: [] }
 *
 * validateQueryKey(['GLOBAL', 'users', 'list'])
 * // { valid: false, warnings: ['Tipo de cache não deve estar na query key'] }
 */
export function validateQueryKey(queryKey) {
  const warnings = []

  if (!Array.isArray(queryKey)) {
    warnings.push('Query key deve ser um array')
    return { valid: false, warnings }
  }

  if (queryKey.length === 0) {
    warnings.push('Query key não pode ser vazio')
    return { valid: false, warnings }
  }

  if (typeof queryKey[0] !== 'string') {
    warnings.push('Nome da feature (primeiro elemento) deve ser uma string')
  }

  // Anti-patterns comuns
  const firstElement = queryKey[0]
  if (['GLOBAL', 'SENSITIVE', 'LOCAL'].includes(firstElement)) {
    warnings.push('Tipo de cache não deve estar na query key. Use opções de query.')
  }

  if (queryKey.some((key) => typeof key === 'function')) {
    warnings.push('Query key não deve conter funções')
  }

  return {
    valid: warnings.length === 0,
    warnings,
    structure: {
      feature: queryKey[0],
      type: queryKey[1],
      parameters: queryKey.slice(2)
    }
  }
}

/**
 * Debug utility para visualizar a estrutura de um query key factory
 *
 * @param {Object} keyFactory - Query key factory
 * @param {string} name - Nome do factory para exibição
 *
 * @example
 * const userKeys = createQueryKeyFactory('users')
 * debugQueryKeys(userKeys, 'userKeys')
 *
 * // Console output:
 * // Query Keys para 'userKeys':
 * // ├─ all: ['users']
 * // ├─ lists(): ['users', 'list']
 * // ├─ details(): ['users', 'detail']
 * // └─ tab(): ['users', 'tab', ...]
 */
export function debugQueryKeys(keyFactory, name = 'factory') {
  console.group(`Query Keys para '${name}':`)

  console.log('├─ all:', keyFactory.all)

  const methods = Object.keys(keyFactory).filter((key) => key !== 'all')
  methods.forEach((method, index) => {
    const isLast = index === methods.length - 1
    const prefix = isLast ? '└─' : '├─'

    try {
      const result = keyFactory[method]()
      console.log(`${prefix} ${method}():`, result)
    } catch {
      console.log(`${prefix} ${method}: [requer parâmetros]`)
    }
  })

  console.groupEnd()
}

/**
 * Helpers para criar query keys de recursos aninhados
 *
 * @example
 * // Rules Engine aninhado em Edge Application
 * const rulesKeys = createNestedQueryKeyFactory('rules-engine', 'edge-applications')
 *
 * rulesKeys.underParent(123)
 * // ['edge-applications', 'detail', 123, 'rules-engine']
 *
 * rulesKeys.listUnderParent(123, { phase: 'request' })
 * // ['edge-applications', 'detail', 123, 'rules-engine', 'list', { phase: 'request' }]
 */
export function createNestedQueryKeyFactory(resource, parent) {
  return {
    /**
     * Todos os recursos sob um parent específico
     */
    underParent: (parentId) => [parent, 'detail', unwrapReactive(parentId), resource],

    /**
     * Lista de recursos sob um parent com filtros
     */
    listUnderParent: (parentId, filters = {}) => [
      parent,
      'detail',
      unwrapReactive(parentId),
      resource,
      'list',
      unwrapReactive(filters)
    ],

    /**
     * Detalhe de um recurso específico sob um parent
     */
    detailUnderParent: (parentId, resourceId) => [
      parent,
      'detail',
      unwrapReactive(parentId),
      resource,
      'detail',
      unwrapReactive(resourceId)
    ]
  }
}

// Exports
export { validateQueryKey as validate }
export { debugQueryKeys as debug }
export { unwrapReactive }
