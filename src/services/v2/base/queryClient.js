import { QueryClient, useQuery } from '@tanstack/vue-query'
import { cacheManager } from './cache/CacheManager'
import { getCacheConfig } from './cache/CacheConfig'
import { TIME, RETRY } from './constants'

class EnhancedQueryClient {
  /**
   * Inicializa a instância do EnhancedQueryClient
   * Cria o cacheManager, instancia o QueryClient do TanStack, define flags de inicialização
   */
  constructor() {
    this.cacheManager = cacheManager
    this.queryClient = this._createQueryClient()
    this.isInitialized = false
    this.initializationPromise = null
  }

  /**
   * Inicializa o cliente de forma assíncrona com controle de concorrência
   * Verifica se já foi inicializado, reutiliza promise em andamento ou cria nova inicialização
   * Evita múltiplas inicializações simultâneas
   */
  async initialize() {
    if (this.isInitialized) return

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._doInitialize()
    return this.initializationPromise
  }

  /**
   * Executa a inicialização real do sistema
   * Inicializa o cacheManager, configura subscrições de cache e marca como inicializado
   */
  async _doInitialize() {
    await this.cacheManager.initialize()
    this._setupCacheSubscription()
    this.isInitialized = true
  }

  /**
   * Inicialização antecipada com retorno de status
   * Chama initialize() e retorna o status de inicialização
   */
  async initializeEarly() {
    await this.initialize()
    return this.isInitialized
  }

  /**
   * Cria e configura o QueryClient do TanStack
   * Configurações: staleTime (5min), gcTime (10min), retry (2x queries, 1x mutations)
   * refetchOnWindowFocus: false, refetchOnReconnect: true
   */
  _createQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: TIME.QUERY_STALE_5_MINUTES,
          gcTime: TIME.QUERY_GC_10_MINUTES,
          retry: RETRY.RETRY_2_TIMES,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true
        },
        mutations: {
          retry: RETRY.RETRY_1_TIME
        }
      }
    })
  }

  /**
   * Configura subscrição para eventos de cache
   * Monitora queries bem-sucedidas e persiste dados automaticamente
   */
  _setupCacheSubscription() {
    this.queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'success') {
        this._handleQuerySuccess(event)
      }
    })
  }

  /**
   * Processa queries bem-sucedidas para persistência
   * Verifica se query tem dados e é persistente, serializa chave, obtém configuração e salva no cacheManager
   */
  async _handleQuerySuccess(event) {
    const { queryKey, state, meta } = event.query

    if (!state.data || !meta?.persistent) return

    try {
      const cacheKey = this._serializeQueryKey(queryKey)
      const config = meta.persistent.type ? getCacheConfig(meta.persistent.type) : meta.persistent

      await this.cacheManager.set(cacheKey, state.data, {
        ttl: config.ttl,
        type: config.type,
        userScope: meta.persistent.userScope
      })
    } catch (error) {
      // Silent fail - cache is optional
    }
  }

  /**
   * Converte chave da query em string serializada
   * Trata arrays e objetos, ordena chaves para consistência, converte null/undefined para 'null'
   */
  _serializeQueryKey(queryKey) {
    if (!Array.isArray(queryKey)) {
      return String(queryKey)
    }

    return queryKey
      .map((item) => {
        if (item === null || item === undefined) {
          return 'null'
        }
        if (typeof item === 'object') {
          try {
            const sortedKeys = Object.keys(item).sort()
            const sortedObj = {}
            sortedKeys.forEach((key) => {
              sortedObj[key] = item[key]
            })
            return JSON.stringify(sortedObj)
          } catch (error) {
            return 'invalid_object'
          }
        }
        return String(item)
      })
      .join('_')
  }

  /**
   * Hook principal para executar queries com suporte a persistência
   * Com persistência: verifica cache primeiro, executa queryFn se cache expirou
   * Sem persistência: executa queryFn diretamente
   * Configurações especiais para queries persistentes: staleTime: 0, refetchOnMount: true, etc.
   */
  useQuery(options) {
    const { queryKey, queryFn, persistent, ...restOptions } = options

    const enhancedQueryFn = persistent
      ? async () => {
          const cachedData = await this._getCachedDataIfValid(queryKey)
          if (cachedData) {
            return cachedData
          }
          // Se persistência expirou, executa queryFn para buscar dados frescos
          return queryFn()
        }
      : queryFn

    // Configurações específicas para queries persistentes
    const persistentOptions = persistent
      ? {
          staleTime: 0, // Dados sempre considerados stale para forçar verificação
          refetchOnMount: true, // Sempre verifica no mount
          refetchOnWindowFocus: true, // Verifica quando janela ganha foco
          refetchOnReconnect: true, // Verifica quando reconecta
          retry: RETRY.RETRY_3_TIMES // Mais tentativas para queries persistentes
        }
      : {}

    return useQuery({
      queryKey,
      queryFn: enhancedQueryFn,
      meta: { persistent },
      ...persistentOptions,
      ...restOptions
    })
  }

  /**
   * Recupera dados do cache se válidos
   * Inicializa se necessário, serializa chave e busca no cacheManager
   */
  async _getCachedDataIfValid(queryKey) {
    try {
      await this.initialize()
      const cacheKey = this._serializeQueryKey(queryKey)
      const data = await this.cacheManager.get(cacheKey)
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Invalida queries específicas
   * Delega para o QueryClient do TanStack
   */
  invalidateQueries(...args) {
    return this.queryClient.invalidateQueries(...args)
  }

  /**
   * Define dados diretamente no cache da query
   * Delega para o QueryClient do TanStack
   */
  setQueryData(...args) {
    return this.queryClient.setQueryData(...args)
  }

  /**
   * Recupera dados do cache da query
   * Delega para o QueryClient do TanStack
   */
  getQueryData(...args) {
    return this.queryClient.getQueryData(...args)
  }

  /**
   * Limpa todo o cache persistente
   * Chama cacheManager.clear()
   */
  async clearCache() {
    await this.cacheManager.clear()
  }

  /**
   * Limpa cache persistente de um usuário específico
   * Limpa cache com escopo de usuário
   */
  async clearUserPersistentCache(userId) {
    await this.cacheManager.clear({ userScope: userId })
  }

  /**
   * Pré-carrega dados do cache para uma query
   * Verifica se dados já existem no QueryClient, se não existem busca no cache persistente
   * Se encontra no cache, define no QueryClient e retorna dados encontrados
   */
  async preloadCache(queryKey) {
    await this.initialize()
    const existingData = this.queryClient.getQueryData(queryKey)
    if (!existingData) {
      const cachedData = await this._getCachedDataIfValid(queryKey)
      if (cachedData) {
        this.queryClient.setQueryData(queryKey, cachedData)
        return cachedData
      }
    }
    return existingData
  }
}

export const enhancedQueryClient = new EnhancedQueryClient()
export const queryClient = enhancedQueryClient.queryClient