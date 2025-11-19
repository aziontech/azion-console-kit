/**
 * TanStack Query - Configurações Centralizadas
 *
 * Este arquivo centraliza todas as configurações de cache e tempo para o TanStack Query.
 * Use estas constantes e presets nas suas queries para manter consistência.
 */

// =============================================================================
// CONSTANTES DE TEMPO
// Use estas constantes para staleTime, gcTime e refetchInterval
// =============================================================================

export const CACHE_TIME = {
  NO_CACHE: 0,
  THIRTY_SECONDS: 30 * 1000,
  ONE_MINUTE: 1 * 60 * 1000,
  TWO_MINUTES: 2 * 60 * 1000,
  THREE_MINUTES: 3 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000,
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000
}

// =============================================================================
// CONFIGURAÇÕES DE CACHE PRÉ-DEFINIDAS
// Use estas configs via spread operator nas suas queries
// =============================================================================

/**
 * Dados estáticos ou que mudam raramente
 * Exemplos: marketplace solutions, feature flags, system config, templates
 *
 * Características:
 * - Cache longo (30 dias)
 * - Retry agressivo (2 tentativas)
 * - Não refetch em eventos normais
 *
 * @example
 * useQuery({
 *   queryKey: solutionKeys.list(filters),
 *   queryFn: () => fetchSolutions(filters),
 *   ...QUERY_CONFIG.STATIC
 * })
 */
export const QUERY_CONFIG = {
  STATIC: {
    staleTime: CACHE_TIME.THIRTY_DAYS,
    gcTime: CACHE_TIME.TWENTY_FOUR_HOURS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 2
  },

  /**
   * Dados de usuário (sensíveis ou específicos do user)
   * Exemplos: account info, user settings, billing info, preferences
   *
   * Características:
   * - Cache médio (5 minutos)
   * - Refetch ao reconectar
   * - Garbage collect após 15 minutos
   *
   * @example
   * useQuery({
   *   queryKey: accountKeys.info(),
   *   queryFn: () => fetchAccountInfo(),
   *   ...QUERY_CONFIG.USER
   * })
   */
  USER: {
    staleTime: CACHE_TIME.FIVE_MINUTES,
    gcTime: CACHE_TIME.FIFTEEN_MINUTES,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    retry: 2
  },

  /**
   * Listas e tabelas paginadas
   * Exemplos: data tables, search results, paginated lists
   *
   * Características:
   * - Cache curto (2 minutos)
   * - Refetch ao montar
   * - Garbage collect após 5 minutos
   *
   * @example
   * useQuery({
   *   queryKey: edgeFunctionKeys.list(filters),
   *   queryFn: () => fetchEdgeFunctions(filters),
   *   ...QUERY_CONFIG.LIST
   * })
   */
  LIST: {
    staleTime: CACHE_TIME.TWO_MINUTES,
    gcTime: CACHE_TIME.FIVE_MINUTES,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: 1
  },

  /**
   * Detalhes de recursos (edit forms, detail pages)
   * Exemplos: edge function detail, application config, rule detail
   *
   * Características:
   * - Cache médio (5 minutos)
   * - Refetch ao montar
   * - Garbage collect após 10 minutos
   *
   * @example
   * useQuery({
   *   queryKey: edgeFunctionKeys.detail(id),
   *   queryFn: () => fetchEdgeFunction(id),
   *   ...QUERY_CONFIG.DETAIL
   * })
   */
  DETAIL: {
    staleTime: CACHE_TIME.FIVE_MINUTES,
    gcTime: CACHE_TIME.FIFTEEN_MINUTES,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: 2
  },

  /**
   * Dados em tempo real ou que mudam constantemente
   * Exemplos: live metrics, current status, real-time dashboards
   *
   * Características:
   * - Sem cache (sempre fresh)
   * - Refetch automático a cada 30 segundos
   * - Refetch em todos os eventos
   *
   * @example
   * useQuery({
   *   queryKey: metricsKeys.realtime(),
   *   queryFn: () => fetchRealtimeMetrics(),
   *   ...QUERY_CONFIG.REALTIME
   * })
   */
  REALTIME: {
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: CACHE_TIME.THIRTY_SECONDS,
    retry: 1
  },

  /**
   * Dados que nunca devem ser cacheados
   * Exemplos: one-time tokens, CSRF tokens, temporary data
   *
   * Características:
   * - Sem cache
   * - Sem retry
   * - Sempre busca do servidor
   *
   * @example
   * useQuery({
   *   queryKey: authKeys.token(),
   *   queryFn: () => fetchToken(),
   *   ...QUERY_CONFIG.NO_CACHE
   * })
   */
  NO_CACHE: {
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: 0
  },

  /**
   * Dados de background/prefetch
   * Exemplos: dados pré-carregados, sugestões, autocomplete
   *
   * Características:
   * - Cache longo mas baixa prioridade
   * - Não refetch automaticamente
   * - Garbage collect rápido se não usado
   *
   * @example
   * useQuery({
   *   queryKey: suggestionsKeys.list(term),
   *   queryFn: () => fetchSuggestions(term),
   *   ...QUERY_CONFIG.BACKGROUND
   * })
   */
  BACKGROUND: {
    staleTime: CACHE_TIME.FIFTEEN_MINUTES,
    gcTime: CACHE_TIME.FIVE_MINUTES,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 0
  }
}

export const PERSISTENCE_CONFIG = {
  IDB_NAME: 'azion',
  IDB_STORE_NAME: 'cache-store',
  CACHE_KEY: 'query-cache',
  VERSION: 'v1',
  MAX_AGE: CACHE_TIME.TWENTY_FOUR_HOURS,
  DEHYDRATE_OPTIONS: {
    shouldDehydrateQuery: (query) => {
      return query.state.status === 'success'
    }
  },
  HYDRATE_OPTIONS: {
    defaultOptions: {
      queries: {
        gcTime: CACHE_TIME.TWENTY_FOUR_HOURS
      }
    }
  }
}
