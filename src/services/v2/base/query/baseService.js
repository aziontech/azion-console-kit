/**
 * @deprecated ARQUIVO DEPRECIADO - NÃO USE EM NOVO CÓDIGO
 *
 * Este arquivo foi depreciado e será removido em uma versão futura.
 *
 * MOTIVO DA DEPRECIAÇÃO:
 * BaseService adiciona abstração desnecessária sobre o TanStack Query,
 * tornando o código mais complexo sem trazer benefícios reais.
 *
 * MIGRAÇÃO:
 * Use o padrão de queries.js para novos serviços.
 *
 * Documentação:
 * - Guia de migração: src/services/v2/MIGRATION_GUIDE.md
 * - Exemplos práticos:
 *   - src/services/v2/marketplace/queries.js
 *   - src/services/v2/account/queries.js
 *
 * BENEFÍCIOS DO NOVO PADRÃO:
 * ✅ Uso direto do TanStack Query (menos abstração)
 * ✅ Melhor reatividade com Vue Composition API
 * ✅ Query Key Factories para gerenciamento de cache
 * ✅ queryOptions pattern (padrão v5)
 * ✅ Configuração de cache por query (não global)
 * ✅ Reatividade automática (aceita ref/computed sem unref)
 *
 * SERVIÇOS EXISTENTES:
 * Os serviços que ainda usam BaseService continuarão funcionando,
 * mas devem ser migrados gradualmente para o novo padrão.
 */

import { useQuery } from '@tanstack/vue-query'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { CACHE_TIME, QUERY_CONFIG } from '@/services/v2/base/query/config'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { getMutex, coalesceRequest } from '@/services/v2/base/query/concurrency'

/**
 * @deprecated Não use em novo código
 */
export class BaseService {
  constructor() {
    // Singleton pattern (mantido para compatibilidade)
    if (this.constructor.instance) return this.constructor.instance

    this.cacheTime = CACHE_TIME
    this.http = httpService
    this.queryClient = queryClient

    this.constructor.instance = this
  }

  /**
   * @deprecated Use queries.js com createQueryKeyFactory() ao invés
   */
  useQuery({ key, queryFn, cache = 'GLOBAL', overrides = {} }) {
    console.warn(
      '⚠️  BaseService.useQuery() está depreciado. Migre para queries.js\n' +
        'Veja: src/services/v2/MIGRATION_GUIDE.md'
    )

    // Legacy support: cria query key simples (sem cache type)
    const queryKey = Array.isArray(key) ? key : [key]

    // Legacy support: mapeia cache types antigos para novos configs
    let config = QUERY_CONFIG.LIST
    if (cache === 'GLOBAL') config = QUERY_CONFIG.STATIC
    if (cache === 'SENSITIVE') config = QUERY_CONFIG.USER
    if (cache === 'NONE') config = QUERY_CONFIG.NO_CACHE

    return useQuery({
      queryKey,
      queryFn,
      ...config,
      ...overrides
    })
  }

  /**
   * @deprecated Use queries.js com queryClient.ensureQueryData() ao invés
   */
  async queryAsync({ key, queryFn, cache = 'GLOBAL', overrides = {} }) {
    console.warn(
      '⚠️  BaseService.queryAsync() está depreciado. Migre para queries.js\n' +
        'Veja: src/services/v2/MIGRATION_GUIDE.md'
    )

    await waitForPersistenceRestore()

    const queryKey = Array.isArray(key) ? key : [key]

    let config = QUERY_CONFIG.LIST
    if (cache === 'GLOBAL') config = QUERY_CONFIG.STATIC
    if (cache === 'SENSITIVE') config = QUERY_CONFIG.USER
    if (cache === 'NONE') config = QUERY_CONFIG.NO_CACHE

    return this.queryClient.ensureQueryData({
      queryKey,
      queryFn,
      ...config,
      ...overrides
    })
  }

  /**
   * @deprecated Use getMutex() diretamente de concurrency.js
   */
  withMutex(key, mutationFn) {
    const mutex = getMutex(key)
    return (variables) => mutex.run(() => mutationFn(variables))
  }

  /**
   * @deprecated Use queryClient.removeQueries() com queryKeys adequadas
   */
  async clearAll() {
    return queryClient.clear()
  }
}
