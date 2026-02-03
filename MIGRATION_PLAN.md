# Plano de Migração: Serviços Legados → TanStack Query

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Padrão Único Definido](#padrão-único-definido)
3. [Processo de Migração](#processo-de-migração)
4. [Lista de Serviços para Migrar](#lista-de-serviços-para-migrar)
5. [Exemplos de Migração](#exemplos-de-migração)
6. [Checklist por Serviço](#checklist-por-serviço)

---

## 🎯 Visão Geral

### Objetivos

- ✅ Migrar todos os serviços legados para o padrão TanStack Query
- ✅ Estabelecer um padrão único e consistente para todos os serviços
- ✅ Consolidar serviços em `src/services/` (estrutura flat)
- ✅ Deprecar gradualmente os serviços legados
- ✅ Melhorar performance com cache inteligente
- ✅ Reduzir código duplicado

### Estatísticas

- **Serviços Legados**: 39 diretórios
- **Arquivos Totais**: ~272 arquivos
- **Serviços já migrados**: 27 módulos
- **Estimativa de Migração**: ~39 serviços (um de cada vez)

---

## 📐 Padrão Único Definido

### Estrutura de Diretório

```
src/services/
├── core/                          # Infraestrutura base
│   ├── auth/
│   ├── broadcast/
│   ├── cache-sync/
│   ├── http/
│   └── query/
├── {module-name}/                 # Módulo de serviço (mesmo nível de core)
│   ├── {module-name}-service.js   # Classe principal do serviço
│   ├── {module-name}-adapter.js   # Adapter de transformação (opcional)
│   └── index.js                   # Exportação barrel
├── domains/                       # Exemplo: serviço de domínios
├── edge-app/                      # Exemplo: serviço de edge application
├── users/                         # Exemplo: serviço de usuários
└── ...
```

### Estrutura de Arquivo de Serviço

#### Template: `{module-name}-service.js`

```javascript
import { BaseService } from '@/services/core/base/query/baseService'
import { queryKeys } from '@/services/core/base/query/queryKeys'
import { ModuleAdapter } from './{module-name}-adapter' // opcional

/**
 * Descrição do serviço
 * @extends BaseService
 */
export class ModuleService extends BaseService {
  // ============================================
  // CONFIGURAÇÃO
  // ============================================

  /** Adapter para transformação de dados (opcional) */
  adapter = ModuleAdapter

  /** Base URL da API */
  baseURL = 'v4/workspace/{resource}'

  /** Campos padrão para listagem */
  fieldsDefault = ['id', 'name', 'created_at', 'updated_at']

  // ============================================
  // MÉTODOS PRIVADOS (prefixo #)
  // ============================================

  /**
   * Busca lista de recursos
   * @private
   */
  #fetchList = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })
    const { count, results } = data
    const body = this.adapter?.transformList?.(results, params.fields) ?? results
    return { body, count }
  }

  /**
   * Busca um único recurso
   * @private
   */
  #fetchOne = async ({ id, params }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`,
      params
    })
    return this.adapter?.transformOne?.(data) ?? data.data
  }

  // ============================================
  // MÉTODOS PÚBLICOS - LEITURA (fetch*)
  // ============================================

  /**
   * Lista recursos
   * @param {Object} params - Parâmetros de query
   * @param {Object} options - Opções do método
   * @param {boolean} options.reactive - Se true, usa useQuery (TanStack). Se false, faz fetch direto.
   * @returns {Promise<{body: Array, count: number}>}
   *
   * @example
   * // Modo reativo (TanStack Query) - para novos componentes
   * const { data } = await service.fetchList(params, { reactive: true })
   *
   * // Modo direto (sync) - compatível com código legado
   * const data = await service.fetchList(params) // reactive: false é o padrão
   */
  fetchList = async (params, { reactive = false } = {}) => {
    // Modo direto (sync) - compatível com código legado
    if (!reactive) {
      return await this.#fetchList(params)
    }

    // Modo reativo (TanStack Query)
    const skipCache = params?.hasFilter || params?.skipCache || params?.search
    const firstPage = params?.page === 1
    const queryKey = queryKeys.module.list(params)

    return await this.useEnsureQueryData(queryKey, () => this.#fetchList(params), {
      persist: firstPage && !skipCache,
      skipCache
    })
  }

  /**
   * Carrega um recurso específico
   * @param {Object} payload - { id, params }
   * @param {Object} options - Opções do método
   * @param {boolean} options.reactive - Se true, usa useQuery (TanStack). Se false, faz fetch direto.
   * @returns {Promise<Object>}
   *
   * @example
   * // Modo reativo (TanStack Query)
   * const { data } = await service.fetchOne({ id: 1 }, { reactive: true })
   *
   * // Modo direto (sync) - compatível com código legado
   * const data = await service.fetchOne({ id: 1 }) // reactive: false é o padrão
   */
  fetchOne = async (payload, { reactive = false } = {}) => {
    // Modo direto (sync) - compatível com código legado
    if (!reactive) {
      return await this.#fetchOne(payload)
    }

    // Modo reativo (TanStack Query)
    const queryKey = queryKeys.module.detail(payload.id)
    return await this.useEnsureQueryData(queryKey, () => this.#fetchOne(payload), {
      persist: false
    })
  }

  // ============================================
  // MÉTODOS PÚBLICOS - MUTAÇÃO (mutate*)
  // ============================================

  /**
   * Cria novo recurso
   * @param {Object} payload - Dados do recurso
   * @returns {Promise<Object>}
   */
  mutateCreate = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.module.all })
    return data
  }

  /**
   * Atualiza recurso existente
   * @param {Object} payload - { id, ...dados }
   * @returns {Promise<string>}
   */
  mutateEdit = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.module.all })
    return 'Resource successfully updated'
  }

  /**
   * Deleta recurso
   * @param {string|number} id - ID do recurso
   * @returns {Promise<string>}
   */
  mutateDelete = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.module.all })
    return 'Resource successfully deleted'
  }

  // ============================================
  // MÉTODOS PÚBLICOS - PREFETCH (prefetch*)
  // ============================================

  /**
   * Prefetch para otimização
   * @param {number} pageSize
   * @returns {Promise<Object>}
   */
  prefetchList = async (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      fields: this.fieldsDefault,
      ordering: '-created_at'
    }

    const firstPage = params?.page === 1
    const skipCache = params?.hasFilter || params?.skipCache || params?.search

    return await this.useEnsureQueryData(
      queryKeys.module.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }
}

// ============================================
// EXPORTAÇÃO DA INSTÂNCIA SINGLETON
// ============================================
export const moduleService = new ModuleService()
```

#### Template: `{module-name}-adapter.js`

```javascript
import { formatDateToDayMonthYearHour, convertToRelativeTime } from '@/helpers/convert-date'

/**
 * Adapter para transformação de dados do Módulo
 */
export const ModuleAdapter = {
  /**
   * Transforma lista de recursos (API → UI)
   * @param {Array} data - Dados da API
   * @returns {Array}
   */
  transformList(data) {
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      isActive: item.active,
      createdAt: formatDateToDayMonthYearHour(item.created_at),
      updatedAt: convertToRelativeTime(item.updated_at)
    }))
  },

  /**
   * Transforma um único recurso (API → UI)
   * @param {Object} response - Resposta da API
   * @returns {Object}
   */
  transformOne({ data }) {
    return {
      id: data?.id,
      name: data?.name,
      isActive: data?.active,
      createdAt: data?.created_at,
      updatedAt: data?.updated_at
    }
  },

  /**
   * Transforma payload para envio (UI → API)
   * @param {Object} payload - Dados do formulário
   * @returns {Object}
   */
  transformPayload(payload) {
    return {
      name: payload.name,
      active: payload.isActive
    }
  }
}
```

#### Template: `index.js`

```javascript
export { ModuleService, moduleService } from './{module-name}-service'
export { ModuleAdapter } from './{module-name}-adapter'
```

### Convenções de Nomenclatura

#### Classes e Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **Diretório** | kebab-case | `edge-application/` |
| **Classe Service** | PascalCase + Service | `EdgeApplicationService` |
| **Instância Service** | camelCase + Service | `edgeApplicationService` |
| **Classe Adapter** | PascalCase + Adapter | `EdgeApplicationAdapter` |
| **Arquivo Service** | kebab-case-service.js | `edge-application-service.js` |
| **Arquivo Adapter** | kebab-case-adapter.js | `edge-application-adapter.js` |

#### Métodos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **Métodos Privados (fetch)** | #fetchCamelCase | `#fetchList`, `#fetchOne`, `#fetchById` |
| **Métodos Públicos (leitura)** | fetchCamelCase | `fetchList`, `fetchOne`, `fetchById`, `fetchWithFilters` |
| **Métodos Públicos (mutação)** | mutateCamelCase | `mutateCreate`, `mutateEdit`, `mutateDelete`, `mutateBulkDelete` |
| **Métodos Públicos (prefetch)** | prefetchCamelCase | `prefetchList`, `prefetchOne` |
| **Métodos Legados** | camelCaseService | `listEdgeApplicationsService` (deprecar) |

#### Resumo do Padrão fetch/mutate

- **fetch*** → Operações de **leitura** (GET) - retornam dados
- **mutate*** → Operações de **escrita** (POST, PUT, PATCH, DELETE) - modificam dados
- **prefetch*** → Operações de **pré-carregamento** para otimização

#### Query Keys

```javascript
// Adicionar em: src/services/core/base/query/queryKeys.js
export const queryKeys = {
  module: {
    all: ['modules'],
    list: (params) => [...queryKeys.module.all, 'list', params],
    detail: (id) => [...queryKeys.module.all, 'detail', id],
    // Para recursos aninhados:
    subResource: {
      all: (parentId) => [...queryKeys.module.detail(parentId), 'sub-resources'],
      detail: (parentId, id) => [...queryKeys.module.detail(parentId), 'sub-resources', 'detail', id]
    }
  }
}
```

### Estrategia de Migracao Gradual (reactive option)

Os metodos `fetch*` possuem uma opcao `reactive` que permite escolher entre:

- **`reactive: false`** (padrao) - Modo direto/sync, compativel com codigo legado
- **`reactive: true`** - Modo reativo com TanStack Query (cache, invalidacao, etc.)

Isso permite migrar os servicos sem precisar alterar todo o codigo de UI de uma vez.

```javascript
// Codigo legado - continua funcionando
const data = await domainsService.fetchList(params)

// Novo codigo com TanStack Query
const { data } = await domainsService.fetchList(params, { reactive: true })
```

**Estrategia recomendada:**
1. Migrar o servico com `reactive: false` como padrao
2. Testar que o codigo legado continua funcionando
3. Gradualmente migrar componentes para usar `reactive: true`
4. Quando todos os consumidores usarem `reactive: true`, alterar o padrao

---

### Regras de Negocio

1. **Cache Strategy**:
   - Primeira página sem filtros: `persist: true`
   - Páginas com filtros/busca: `skipCache: true, persist: false`
   - Detalhes: `persist: false` (dados dinâmicos)

2. **Invalidação de Cache**:
   - Após `create`: remover `queryKeys.module.all`
   - Após `edit`: remover `queryKeys.module.all`
   - Após `delete`: remover `queryKeys.module.all`

3. **Adaptação de Dados**:
   - **API → UI**: `transformList`, `transformOne`
   - **UI → API**: `transformPayload`
   - Sempre usar operador `??` para fallback

4. **Mensagens de Retorno**:
   - Create: retornar `data` completo da API
   - Edit: retornar mensagem de sucesso
   - Delete: retornar mensagem de sucesso

---

## 🔄 Processo de Migração

### Fase 1: Preparação (Uma Vez)

- [ ] Criar branch: `feat/migrate-services-to-core`
- [ ] Backup dos serviços legados
- [ ] Definir ordem de migração (ver lista abaixo)

### Fase 2: Migração Individual (Por Serviço)

Para cada serviço:

1. **Análise do Serviço Legado**
   - [ ] Ler todos os arquivos do serviço legado
   - [ ] Identificar todas as operações (list, load, create, edit, delete, etc)
   - [ ] Mapear endpoints da API
   - [ ] Identificar transformações de dados

2. **Criar Estrutura do Novo Serviço**
   - [ ] Criar diretório em `src/services/{module-name}/`
   - [ ] Criar `{module-name}-service.js`
   - [ ] Criar `{module-name}-adapter.js` (se necessário)
   - [ ] Criar `index.js`

3. **Adicionar Query Keys**
   - [ ] Adicionar query keys em `src/services/core/base/query/queryKeys.js`
   - [ ] Definir hierarquia de keys (all, list, detail, sub-resources)

4. **Implementar Service**
   - [ ] Implementar métodos privados (#fetchList, #fetchOne)
   - [ ] Implementar métodos públicos (list, load, create, edit, delete)
   - [ ] Implementar métodos específicos do domínio
   - [ ] Adicionar JSDoc em todos os métodos

5. **Implementar Adapter**
   - [ ] Criar transformMap
   - [ ] Implementar transformList
   - [ ] Implementar transformOne
   - [ ] Implementar transformPayload

6. **Migrar Consumidores**
   - [ ] Encontrar todos os arquivos que importam o serviço legado
   - [ ] Atualizar imports para o novo serviço
   - [ ] Atualizar chamadas de método (se necessário)
   - [ ] Testar cada consumidor

7. **Testes**
   - [ ] Testar operações CRUD
   - [ ] Verificar cache funcionando
   - [ ] Verificar invalidação de cache
   - [ ] Testar em múltiplas abas (sincronização)

8. **Cleanup**
   - [ ] Adicionar `@deprecated` no serviço legado
   - [ ] Commit das alterações
   - [ ] (Após confirmação) Deletar serviço legado

---

## 📝 Lista de Serviços para Migrar

### Status da Migração

- ✅ = Já migrado
- 🔄 = Em progresso
- ⏸️ = Aguardando migração
- ⚠️ = Requer atenção especial

### Ordem de Prioridade

#### 🔥 PRIORIDADE 1 - Core Services (Críticos)

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 1 | Domains | `domains-services/` | ⏸️ | CRUD completo |
| 2 | Personal Tokens | `personal-tokens-services/` | ⏸️ | Token management |
| 3 | Variables | `variables-services/` | ⏸️ | Environment vars |
| 4 | Team Permission | `team-permission/` | ⏸️ | Permissões e times |
| 5 | Identity Providers | `identity-providers-services/` | ⏸️ | SAML/OIDC |

#### 📦 PRIORIDADE 2 - Edge Services

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 6 | Edge Application Origins | `edge-application-origins-services/` | ⏸️ | Sub-recurso de edge-app |
| 7 | Edge Node | `edge-node-services/` | ⏸️ | Node management |
| 8 | Edge Node Service | `edge-node-service-services/` | ⏸️ | Related to edge-node |
| 9 | Edge Service | `edge-service-services/` | ⏸️ | Service operations |
| 10 | Edge Service Resources | `edge-service-resources-services/` | ⏸️ | Resource management |

#### 🔧 PRIORIDADE 3 - Utilities & Settings

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 11 | Account Settings | `account-settings-services/` | ⏸️ | Regions, cities, countries |
| 12 | Accounts Management | `accounts-management-services/` | ⏸️ | Multi-account |
| 13 | Contract Services | `contract-services/` | ⏸️ | Contract data |
| 14 | Switch Account | `switch-account-services/` | ⏸️ | Account switching |
| 15 | Sidebar Menus | `sidebar-menus-services/` | ⏸️ | UI menu data |

#### 🎨 PRIORIDADE 4 - UI & Templates

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 16 | Template Engine | `template-engine-services/` | ⏸️ | Template management |
| 17 | Custom Pages | `custom-pages-services/` | ✅ | Já migrado como `custom-page` |

#### 📊 PRIORIDADE 5 - Real-time & Monitoring

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 18 | Real-time Events | `real-time-events-service/` | ⏸️ | ⚠️ Streaming/WebSocket |
| 19 | Real-time Metrics | `real-time-metrics-services/` | ⏸️ | ⚠️ Metrics data |
| 20 | Real-time Purge | `real-time-purge/` | ⏸️ | Já existe `purge` migrado |

#### 🔐 PRIORIDADE 6 - Auth & Security

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 21 | Auth Services | `auth-services/` | ⏸️ | ⚠️ Login/logout/MFA |
| 22 | MFA Services | `mfa-services/` | ✅ | Já migrado |
| 23 | Signup Services | `signup-services/` | ⏸️ | User registration |

#### 🛒 PRIORIDADE 7 - Marketplace & Integrations

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 24 | Marketplace | `marketplace-services/` | ✅ | Já migrado |
| 25 | GitHub Services | `github-services/` | ⏸️ | GitHub integration |
| 26 | VCS | Não existe legado | ✅ | Já migrado |

#### 🔨 PRIORIDADE 8 - Workload & Deployment

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 27 | Workloads | `workloads-services/` | ✅ | Já migrado como `workload` |
| 28 | Workload Deployment | `workload-deployment-service/` | ⏸️ | Related to workload |
| 29 | Script Runner | `script-runner-service/` | ⏸️ | Script execution |

#### 📚 PRIORIDADE 9 - Documentation & Help

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 30 | Help Center | `help-center-services/` | ⏸️ | Documentation |
| 31 | Feedback | `feedback-services/` | ⏸️ | User feedback |
| 32 | Status Page | `status-page-services/` | ⏸️ | Status integration |

#### 🧪 PRIORIDADE 10 - Testing & Dev Tools

| # | Serviço | Diretório Legado | Status | Observações |
|---|---------|------------------|--------|-------------|
| 33 | Compare with Azion | `compare-with-azion/` | ⏸️ | Testing utilities |

#### ✅ PRIORIDADE 11 - Já Migrados (Verificar)

| # | Serviço | Diretório Migrado | Status | Observações |
|---|---------|--------------|--------|-------------|
| 34 | Account | `account/` | ✅ | Confirmar completo |
| 35 | Activity History | `activity-history/` | ✅ | Confirmar completo |
| 36 | Billing | `billing/` | ✅ | Confirmar completo |
| 37 | Data Stream | `data-stream/` | ✅ | Confirmar completo |
| 38 | Digital Certificates | `digital-certificates/` | ✅ | Confirmar completo |
| 39 | Edge App | `edge-app/` | ✅ | Confirmar completo |
| 40 | Edge Firewall | `edge-firewall/` | ✅ | Confirmar completo |
| 41 | Edge Function | `edge-function/` | ✅ | Confirmar completo |
| 42 | Network Lists | `network-lists/` | ✅ | Confirmar completo |
| 43 | Payment | `payment/` | ✅ | Confirmar completo |
| 44 | Users | `users/` | ✅ | Confirmar completo |
| 45 | WAF | `waf/` | ✅ | Confirmar completo |

### Observações Especiais

#### ⚠️ Serviços que Requerem Atenção

1. **Auth Services** (`auth-services/`)
   - Crítico para autenticação
   - Testar extensivamente
   - Pode afetar toda a aplicação

2. **Real-time Services**
   - Podem usar WebSocket/SSE
   - Padrão TanStack Query pode não se aplicar totalmente
   - Considerar `useQuery` com `refetchInterval` ou hooks customizados

3. **Axios Infrastructure**
   - Não migrar, já está encapsulado em `base/http/`
   - Manter como está

---

## 💡 Exemplos de Migração

### Exemplo 1: Serviço Simples (Domains)

#### ANTES (Legacy)

```javascript
// src/services/domains-services/list-domains-service.js
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDomainBaseUrl } from './make-domains-base-url'

export const listDomainsService = async ({ orderBy = 'name', sort = 'asc', page = 1, pageSize = 10 }) => {
  const searchParams = new URLSearchParams({
    order_by: orderBy,
    sort,
    page,
    page_size: pageSize
  })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}
```

```javascript
// src/services/domains-services/make-domains-base-url.js
export const makeDomainBaseUrl = () => 'v3/domains'
```

#### DEPOIS (TanStack Query)

```javascript
// src/services/domains/domains-service.js
import { BaseService } from '@/services/core/base/query/baseService'
import { queryKeys } from '@/services/core/base/query/queryKeys'
import { DomainsAdapter } from './domains-adapter'

export class DomainsService extends BaseService {
  adapter = DomainsAdapter
  baseURL = 'v3/domains'
  fieldsDefault = ['id', 'name', 'cname', 'is_active', 'edge_application_id']

  #fetchList = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })
    const { count, results } = data
    const body = this.adapter?.transformList?.(results, params.fields) ?? results
    return { body, count }
  }

  #fetchOne = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })
    return this.adapter?.transformOne?.(data) ?? data.data
  }

  fetchList = async (params, { reactive = false } = {}) => {
    if (!reactive) {
      return await this.#fetchList(params)
    }

    const skipCache = params?.hasFilter || params?.skipCache || params?.search
    const firstPage = params?.page === 1
    const queryKey = queryKeys.domains.list(params)

    return await this.useEnsureQueryData(queryKey, () => this.#fetchList(params), {
      persist: firstPage && !skipCache,
      skipCache
    })
  }

  fetchOne = async (payload, { reactive = false } = {}) => {
    if (!reactive) {
      return await this.#fetchOne(payload)
    }

    const queryKey = queryKeys.domains.detail(payload.id)
    return await this.useEnsureQueryData(queryKey, () => this.#fetchOne(payload), {
      persist: false
    })
  }

  mutateCreate = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.domains.all })
    return data
  }

  mutateEdit = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.domains.all })
    return 'Domain successfully updated'
  }

  mutateDelete = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.domains.all })
    return 'Domain successfully deleted'
  }
}

export const domainsService = new DomainsService()
```

```javascript
// src/services/domains/domains-adapter.js
import { adaptServiceDataResponse } from '@/services/core/utils/adaptServiceDataResponse'
import { parseStatusData } from '@/services/core/utils/adapter/parse-status-utils'

const transformMap = {
  id: (value) => value.id,
  name: (value) => value.name,
  cname: (value) => value.cname_access_only ? value.cname : value.domain_name,
  status: (value) => parseStatusData(value.is_active),
  edgeApplicationId: (value) => value.edge_application_id
}

export const DomainsAdapter = {
  transformList(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },

  transformOne({ data }) {
    return {
      id: data?.id,
      name: data?.name,
      cnameAccessOnly: data?.cname_access_only,
      cname: data?.cname,
      domainName: data?.domain_name,
      isActive: data?.is_active,
      edgeApplicationId: data?.edge_application_id,
      digitalCertificateId: data?.digital_certificate_id
    }
  },

  transformPayload(payload) {
    return {
      name: payload.name,
      cname_access_only: payload.cnameAccessOnly,
      cname: payload.cname,
      is_active: payload.isActive,
      edge_application_id: payload.edgeApplicationId,
      digital_certificate_id: payload.digitalCertificateId
    }
  }
}
```

```javascript
// src/services/domains/index.js
export { DomainsService, domainsService } from './domains-service'
export { DomainsAdapter } from './domains-adapter'
```

```javascript
// Adicionar em: src/services/core/base/query/queryKeys.js
export const queryKeys = {
  // ... outros keys
  domains: {
    all: ['domains'],
    list: (params) => [...queryKeys.domains.all, 'list', params],
    detail: (id) => [...queryKeys.domains.all, 'detail', id]
  }
}
```

#### Uso no Componente

```javascript
// ANTES (legado)
import { listDomainsService } from '@/services/domains-services'

const loadDomains = async () => {
  const response = await listDomainsService({
    orderBy: 'name',
    sort: 'asc',
    page: 1,
    pageSize: 10
  })
  domains.value = response.body
}

// DEPOIS (modo sync - compativel com codigo legado, sem alterar UI)
import { domainsService } from '@/services/domains'

const loadDomains = async () => {
  const response = await domainsService.fetchList({
    ordering: 'name',
    page: 1,
    pageSize: 10
  })
  domains.value = response.body
}

// DEPOIS (modo reativo - com TanStack Query)
import { domainsService } from '@/services/domains'

const loadDomains = async () => {
  const response = await domainsService.fetchList({
    ordering: 'name',
    page: 1,
    pageSize: 10
  }, { reactive: true })
  domains.value = response.body
}
```

---

### Exemplo 2: Serviço com Mutação (Create)

#### ANTES (Legacy)

```javascript
// src/services/domains-services/create-domain-service.js
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeDomainBaseUrl } from './make-domains-base-url'

export const createDomainService = async (payload) => {
  const parsedPayload = {
    name: payload.name,
    cname_access_only: payload.cnameAccessOnly,
    cname: payload.cname,
    is_active: payload.isActive,
    edge_application_id: payload.edgeApplicationId,
    digital_certificate_id: payload.digitalCertificateId
  }

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makeDomainBaseUrl(),
    method: 'POST',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}
```

#### DEPOIS (TanStack Query)

```javascript
// Já incluído no DomainsService acima
mutateCreate = async (payload) => {
  const body = this.adapter?.transformPayload?.(payload) ?? payload
  const { data } = await this.http.request({
    method: 'POST',
    url: this.baseURL,
    body
  })
  this.queryClient.removeQueries({ queryKey: queryKeys.domains.all })
  return data
}
```

#### Uso com Vue Composition API

```javascript
// ANTES
import { createDomainService } from '@/services/domains-services'

const createDomain = async (formData) => {
  try {
    const response = await createDomainService(formData)
    toast.add({ severity: 'success', summary: 'Domain created' })
    router.push('/domains')
  } catch (error) {
    toast.add({ severity: 'error', summary: error.message })
  }
}

// DEPOIS
import { domainsService } from '@/services/domains'

const createDomain = async (formData) => {
  try {
    const response = await domainsService.mutateCreate(formData)
    toast.add({ severity: 'success', summary: 'Domain created' })
    router.push('/domains')
  } catch (error) {
    toast.add({ severity: 'error', summary: error.message })
  }
}
```

---

## ✅ Checklist por Serviço

Use este checklist para cada serviço migrado:

### [ ] Serviço: _______________

#### Análise
- [ ] Ler todos os arquivos do serviço legado
- [ ] Listar todas as operações (list, load, create, edit, delete, custom)
- [ ] Identificar endpoints da API
- [ ] Identificar transformações de dados necessárias
- [ ] Verificar dependências externas

#### Implementação
- [ ] Criar diretório `src/services/{module-name}/`
- [ ] Criar `{module-name}-service.js`
- [ ] Implementar classe estendendo `BaseService`
- [ ] Adicionar propriedades: `baseURL`, `adapter`, `fieldsDefault`
- [ ] Implementar métodos privados: `#fetchList`, `#fetchOne`
- [ ] Implementar métodos de leitura (fetch*): `fetchList`, `fetchOne`
- [ ] Implementar métodos de mutação (mutate*): `mutateCreate`, `mutateEdit`, `mutateDelete`
- [ ] Implementar métodos de prefetch (prefetch*): `prefetchList` (se necessário)
- [ ] Implementar métodos customizados (se houver)
- [ ] Adicionar JSDoc em todos os métodos
- [ ] Exportar instância singleton

#### Adapter
- [ ] Criar `{module-name}-adapter.js`
- [ ] Implementar `transformMap`
- [ ] Implementar `transformList`
- [ ] Implementar `transformOne`
- [ ] Implementar `transformPayload`
- [ ] Implementar métodos customizados (se necessário)

#### Query Keys
- [ ] Adicionar em `src/services/core/base/query/queryKeys.js`
- [ ] Definir estrutura: `all`, `list`, `detail`
- [ ] Adicionar sub-recursos (se houver)

#### Barrel Export
- [ ] Criar `index.js` no diretório do módulo
- [ ] Exportar `Service` e `service` (instância)
- [ ] Exportar `Adapter`

#### Migração de Consumidores
- [ ] Encontrar todos os imports do serviço legado (usar Grep)
- [ ] Atualizar imports para `@/services/{module-name}`
- [ ] Atualizar chamadas de método
- [ ] Atualizar parâmetros (se necessário)
- [ ] Remover código duplicado

#### Testes
- [ ] Testar `fetchList` (com e sem paginação)
- [ ] Testar `fetchOne`
- [ ] Testar `mutateCreate`
- [ ] Testar `mutateEdit`
- [ ] Testar `mutateDelete`
- [ ] Testar operações customizadas (fetch*/mutate*)
- [ ] Verificar cache funcionando (DevTools)
- [ ] Verificar invalidação de cache após mutações
- [ ] Testar sincronização multi-tab (abrir 2+ abas)
- [ ] Verificar performance (Network tab)

#### Documentação
- [ ] Adicionar comentários JSDoc
- [ ] Atualizar este documento (marcar como ✅)
- [ ] (Opcional) Criar README.md no módulo

#### Cleanup
- [ ] Adicionar `@deprecated` nos arquivos legados
- [ ] Commit: `feat: migrate {module-name} service to TanStack Query`
- [ ] Verificar se há testes unitários para atualizar
- [ ] (Após 2 sprints sem problemas) Deletar serviço legado

---

## 📊 Tracking de Progresso

### Resumo Geral

```
Total de Serviços: 45
✅ Migrados: 12
🔄 Em Progresso: 0
⏸️ Aguardando: 33
```

### Próximos 5 Serviços Recomendados

1. [ ] **Domains** - Alto uso, CRUD completo
2. [ ] **Personal Tokens** - Segurança, token management
3. [ ] **Variables** - Configuração, alto uso
4. [ ] **Team Permission** - Segurança, permissões
5. [ ] **Identity Providers** - Autenticação enterprise

---

## 🎯 Meta Final

**Objetivo**: Migrar todos os 33 serviços legados restantes para o padrão TanStack Query em `src/services/`.

**Critério de Sucesso**:
- ✅ Todos os serviços seguem o padrão único definido
- ✅ Zero serviços legados em produção
- ✅ Estrutura consolidada em `src/services/`
- ✅ Documentação atualizada
- ✅ Testes passando 100%
- ✅ Performance melhorada (cache hits)

---

## 📚 Recursos

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/vue/overview)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- Padrao Adapter: `src/services/edge-app/edge-app-adapter.js`
- Padrao Service: `src/services/edge-app/edge-app-service.js`
- Base Service: `src/services/core/base/query/baseService.js`
- Utils: `src/services/core/utils/`
- **Lista de Servicos**: [SERVICES_MIGRATION_LIST.md](./SERVICES_MIGRATION_LIST.md)

---

**Ultima Atualizacao**: 2026-02-02
**Versao do Plano**: 2.1.0
