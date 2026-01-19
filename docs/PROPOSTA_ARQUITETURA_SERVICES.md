# Proposta de Nova Arquitetura para Services Layer

> **Documento de Decisão Arquitetural (ADR)**
> Data: Janeiro 2026
> Status: Proposta para Revisão
> **Linguagem: JavaScript (com JSDoc para tipagem)**

---

## Índice

1. [Contexto e Situação Atual](#1-contexto-e-situação-atual)
2. [Problemas Identificados](#2-problemas-identificados)
3. [Arquitetura Proposta](#3-arquitetura-proposta)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Camadas e Responsabilidades](#5-camadas-e-responsabilidades)
6. [Padrões e Convenções](#6-padrões-e-convenções)
7. [Estratégia de Testes](#7-estratégia-de-testes)
8. [Implementação de Referência](#8-implementação-de-referência)
9. [Plano de Migração](#9-plano-de-migração)
10. [Benefícios Esperados](#10-benefícios-esperados)
11. [Referências](#11-referências)

---

## Principais Mudanças em Relação à Proposta Anterior

| Aspecto | Antes | Agora |
|---------|-------|-------|
| Linguagem | TypeScript | **JavaScript com JSDoc** |
| Utils | Nova pasta em `/core/utils` | **Usar `/src/utils/` existente** |
| TanStack Query | Obrigatório para todos | **Opcional por módulo** |
| Estrutura de testes | Junto ao código | **Em `/src/tests/` (padrão atual)** |
| Query Keys | Por módulo | **Arquivo centralizado** |
| Objetivo principal | Cache + Arquitetura | **Testabilidade + Arquitetura** |

---

## 1. Contexto e Situação Atual

### 1.1 Visão Geral

O diretório `/src/services/` contém **47 módulos de serviços** com aproximadamente **188 arquivos de serviço legados (v1)** e **38 serviços modernos (v2)**.

### 1.2 Padrão Legado (v1) - Abordagem Funcional

```
domains-services/
├── list-domains-service.js
├── create-domain-service.js
├── load-domain-service.js
├── make-domains-base-url.js
└── index.js
```

**Características:**
- Funções stateless que chamam `AxiosHttpClientAdapter.request()`
- Adaptação de request/response inline dentro da função
- Parsing de response via `parseHttpResponse()`
- Error handling via switch de status code
- Sem gerenciamento de cache/queries

### 1.3 Padrão Moderno (v2) - Baseado em Classes

```
v2/edge-app/
├── edge-app-service.js
├── edge-app-adapter.js
└── index.js
```

**Características:**
- Services estendem `BaseService` com integração TanStack Query
- Query keys definidos como factories
- Suporte a mutations com invalidação automática de cache
- Queries com persistência configurável

### 1.4 Infraestrutura HTTP Atual

**Legado (`/axios`):**
- `AxiosHttpClientAdapter`: Classe estática wrapping axios
- `makeApi()`: Cria instância axios com configurações base
- `AxiosHttpClientSignalDecorator`: Suporte a AbortController

**Moderno (`/v2/base/http`):**
- `HttpClient`: Wrapper para axios com headers/baseURL configuráveis
- `HttpService`: Serviço de alto nível com query params, error handling, AbortManager

---

## 2. Problemas Identificados

### 2.1 Arquitetura Dual (Legacy + Modern)
- ❌ 188 serviços legados vs 38 serviços modernos
- ❌ Padrões inconsistentes no codebase
- ❌ Desenvolvedores precisam entender ambas abordagens
- ❌ Caminho de migração não claro

### 2.2 Serviços Legados sem Cache
- ❌ Cada chamada atinge a API (sem TanStack Query)
- ❌ Gerenciamento manual de loading/error state nos componentes
- ❌ Duplicação de código para padrões CRUD comuns

### 2.3 Transformação de Resposta Inconsistente
- ❌ Legado: Transformação ad-hoc inline
- ❌ v2: Adapters estruturados
- ❌ Difícil manter formatos de dados padronizados

### 2.4 Error Handling Fragmentado
- ❌ Lógica de extração de erro espalhada em 188 serviços
- ❌ Paradigmas de error handling misturados
- ❌ Classes de erro sem uso consistente

### 2.5 Duplicação de HTTP Client
- ❌ Duas implementações separadas de cliente HTTP
- ❌ `AxiosHttpClientAdapter` (legacy) vs `HttpService` (v2)
- ❌ Abordagens diferentes de error handling

### 2.6 Falta de Padronização
- ❌ Sem convenção clara para naming de serviços
- ❌ Query keys não padronizados
- ❌ Documentação limitada

---

## 3. Arquitetura Proposta

### 3.1 Princípios Arquiteturais

Baseado em **Clean Architecture** e **Hexagonal Architecture (Ports & Adapters)**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                │
│                   (Vue Components/Composables)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                           │
│              (Use Cases / Query Composables)                    │
│         useListDomains, useCreateDomain, useDomain              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Domain Layer                              │
│              (Entities, Interfaces, Types)                      │
│         Domain, DomainRepository interface                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                          │
│        (HTTP Client, Adapters, Repository Implementations)      │
│    DomainApiRepository, DomainAdapter, HttpClient               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Benefícios da Arquitetura

1. **Separação Clara de Responsabilidades** - Cada camada tem função específica
2. **Testabilidade** - Camadas podem ser testadas isoladamente
3. **Substituibilidade** - Adapters podem ser trocados sem afetar lógica de negócio
4. **Manutenibilidade** - Mudanças localizadas em uma camada
5. **Escalabilidade** - Fácil adicionar novos features/domínios

---

## 4. Estrutura de Diretórios

### 4.1 Princípios da Nova Estrutura

1. **Usar `/src/utils/` global existente** - Não duplicar utilitários
2. **Migração estrutural** - Manter comportamento atual dos serviços (com ou sem cache)
3. **Testabilidade** - Estrutura que facilita testes unitários com padrão `makeSut()`
4. **JavaScript com JSDoc** - Tipagem via comentários, sem TypeScript

### 4.2 Nova Estrutura Proposta

```
src/
├── utils/                          # [EXISTENTE] Utils globais - NÃO DUPLICAR
│   ├── date.js                     # Funções de data já existentes
│   ├── constants.js                # Constantes globais
│   └── ...
│
├── services/
│   ├── core/                       # Infraestrutura compartilhada (NOVO)
│   │   ├── http/
│   │   │   ├── http-client.js           # Cliente HTTP unificado
│   │   │   ├── http-client.test.js      # Testes do cliente
│   │   │   └── index.js
│   │   │
│   │   ├── error/
│   │   │   ├── error-handler.js         # Handler centralizado de erros
│   │   │   ├── api-error.js             # Classe ApiError
│   │   │   ├── error-handler.test.js    # Testes
│   │   │   └── index.js
│   │   │
│   │   ├── adapters/
│   │   │   ├── response-adapter.js      # Adapter base de response
│   │   │   ├── request-adapter.js       # Adapter base de request
│   │   │   ├── pagination-adapter.js    # Adapter de paginação
│   │   │   ├── adapters.test.js         # Testes
│   │   │   └── index.js
│   │   │
│   │   ├── query/                       # TanStack Query (OPCIONAL por serviço)
│   │   │   ├── query-client.js          # Configuração TanStack Query
│   │   │   ├── cache-config.js          # Presets de cache
│   │   │   └── index.js
│   │   │
│   │   └── index.js                     # Barrel export do core
│   │
│   ├── domains/                    # Módulo de domínio (exemplo)
│   │   ├── adapters/
│   │   │   ├── domain-request-adapter.js
│   │   │   ├── domain-response-adapter.js
│   │   │   ├── __tests__/
│   │   │   │   ├── domain-request-adapter.test.js
│   │   │   │   └── domain-response-adapter.test.js
│   │   │   └── index.js
│   │   │
│   │   ├── services/
│   │   │   ├── list-domains-service.js
│   │   │   ├── load-domain-service.js
│   │   │   ├── create-domain-service.js
│   │   │   ├── edit-domain-service.js
│   │   │   ├── delete-domain-service.js
│   │   │   ├── __tests__/
│   │   │   │   ├── list-domains-service.test.js
│   │   │   │   ├── load-domain-service.test.js
│   │   │   │   └── ...
│   │   │   └── index.js
│   │   │
│   │   ├── composables/                 # OPCIONAL - só se usar TanStack Query
│   │   │   ├── use-domains.js
│   │   │   ├── use-domain.js
│   │   │   └── index.js
│   │   │
│   │   ├── keys/                        # OPCIONAL - só se usar TanStack Query
│   │   │   └── domain-keys.js
│   │   │
│   │   └── index.js                     # Barrel export
│   │
│   ├── edge-applications/          # Outro módulo
│   │   ├── adapters/
│   │   ├── services/
│   │   ├── composables/                 # Opcional
│   │   ├── keys/                        # Opcional
│   │   └── index.js
│   │
│   ├── users/
│   ├── billing/
│   └── ... (outros módulos migrados)
│
├── tests/                          # [EXISTENTE] Testes - manter estrutura
│   └── services/                   # Testes podem ficar aqui OU junto ao código
│       └── ...
```

### 4.3 Estrutura Simplificada por Módulo

Cada módulo segue esta estrutura mínima:

```
{module-name}/
├── adapters/                   # Transformação de dados
│   ├── {name}-request-adapter.js
│   ├── {name}-response-adapter.js
│   ├── __tests__/              # Testes dos adapters
│   └── index.js
│
├── services/                   # Funções de serviço
│   ├── list-{name}-service.js
│   ├── load-{name}-service.js
│   ├── create-{name}-service.js
│   ├── edit-{name}-service.js
│   ├── delete-{name}-service.js
│   ├── __tests__/              # Testes dos serviços
│   └── index.js
│
├── composables/                # OPCIONAL - TanStack Query hooks
│   └── ...
│
├── keys/                       # OPCIONAL - Query keys
│   └── ...
│
└── index.js                    # Barrel export
```

### 4.4 Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Adapter Request | `{name}-request-adapter.js` | `domain-request-adapter.js` |
| Adapter Response | `{name}-response-adapter.js` | `domain-response-adapter.js` |
| Service List | `list-{name}s-service.js` | `list-domains-service.js` |
| Service Load | `load-{name}-service.js` | `load-domain-service.js` |
| Service Create | `create-{name}-service.js` | `create-domain-service.js` |
| Service Edit | `edit-{name}-service.js` | `edit-domain-service.js` |
| Service Delete | `delete-{name}-service.js` | `delete-domain-service.js` |
| Composable Query | `use-{name}s.js` (lista) | `use-domains.js` |
| Composable Mutation | `use-create-{name}.js` | `use-create-domain.js` |
| Query Keys | `{name}-keys.js` | `domain-keys.js` |
| Testes | `{name}.test.js` | `domain-response-adapter.test.js` |

---

## 5. Camadas e Responsabilidades

### 5.1 Core Layer (`/src/services/core/`)

Infraestrutura compartilhada. **Não duplica o `/src/utils/` global**.

#### 5.1.1 HTTP Client

```javascript
// services/core/http/http-client.js
import axios from 'axios'
import { ErrorHandler } from '../error'

/**
 * @typedef {Object} HttpClientConfig
 * @property {string} [baseURL]
 * @property {number} [timeout]
 * @property {Object} [headers]
 */

/**
 * @typedef {Object} HttpResponse
 * @property {*} data
 * @property {number} status
 * @property {Object} headers
 */

/**
 * Cliente HTTP unificado
 * Substitui AxiosHttpClientAdapter e HttpService do v2
 */
export class HttpClient {
  #instance

  /**
   * @param {HttpClientConfig} config
   */
  constructor(config = {}) {
    this.#instance = axios.create({
      baseURL: config.baseURL ?? '/api',
      timeout: config.timeout ?? 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; version=3',
        ...config.headers
      },
      withCredentials: true
    })

    this.#setupInterceptors()
  }

  #setupInterceptors() {
    // Request interceptor para auth
    this.#instance.interceptors.request.use(
      (config) => {
        const token = this.#getAuthToken()
        if (token) {
          config.headers.Authorization = `Token ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor para error handling
    this.#instance.interceptors.response.use(
      (response) => response,
      (error) => this.#handleError(error)
    )
  }

  /**
   * @param {Object} config - Axios request config
   * @returns {Promise<HttpResponse>}
   */
  async request(config) {
    const response = await this.#instance.request(config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers
    }
  }

  async get(url, config) {
    return this.request({ ...config, method: 'GET', url })
  }

  async post(url, data, config) {
    return this.request({ ...config, method: 'POST', url, data })
  }

  async put(url, data, config) {
    return this.request({ ...config, method: 'PUT', url, data })
  }

  async patch(url, data, config) {
    return this.request({ ...config, method: 'PATCH', url, data })
  }

  async delete(url, config) {
    return this.request({ ...config, method: 'DELETE', url })
  }

  #getAuthToken() {
    return localStorage.getItem('auth_token')
  }

  #handleError(error) {
    throw ErrorHandler.handle(error)
  }
}

// Singleton para uso global
export const httpClient = new HttpClient()
```

#### 5.1.2 Error Handler Centralizado

```javascript
// services/core/error/error-handler.js
import axios from 'axios'
import { ApiError } from './api-error'

/**
 * Handler centralizado de erros
 * Extrai mensagens do formato JSON:API usado pela Azion
 */
export class ErrorHandler {
  /**
   * Processa qualquer erro e retorna ApiError padronizado
   * @param {Error|unknown} error
   * @returns {ApiError}
   */
  static handle(error) {
    if (axios.isAxiosError(error)) {
      return this.#handleAxiosError(error)
    }

    if (error instanceof ApiError) {
      return error
    }

    return new ApiError({
      message: 'An unexpected error occurred',
      status: 500,
      code: 'UNEXPECTED_ERROR'
    })
  }

  /**
   * @param {import('axios').AxiosError} error
   * @returns {ApiError}
   */
  static #handleAxiosError(error) {
    const status = error.response?.status ?? 500
    const data = error.response?.data

    const messages = this.#extractMessages(data)
    const meta = this.#extractMeta(data)

    return new ApiError({
      message: messages.join('. '),
      messages,
      status,
      code: this.#getErrorCode(status),
      meta,
      originalError: error
    })
  }

  /**
   * Extrai mensagens do formato JSON:API
   * @param {Object} data
   * @returns {string[]}
   */
  static #extractMessages(data) {
    if (!data?.errors?.length) {
      return ['An error occurred while processing your request']
    }

    return data.errors.map((error) => {
      const field = this.#formatFieldName(error.source?.pointer)
      const detail = error.detail ?? error.title ?? 'Unknown error'
      return field ? `${field}: ${detail}` : detail
    })
  }

  /**
   * Formata nome do campo: /data/attributes/field_name -> Field Name
   * @param {string} pointer
   * @returns {string|null}
   */
  static #formatFieldName(pointer) {
    if (!pointer) return null

    const parts = pointer.split('/')
    const fieldName = parts[parts.length - 1]
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  static #extractMeta(data) {
    if (!data?.errors?.length) return undefined
    return data.errors[0]?.meta
  }

  static #getErrorCode(status) {
    const codes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE'
    }
    return codes[status] ?? 'UNKNOWN_ERROR'
  }

  /**
   * Exibe erros usando toast notification
   * @param {ApiError} error
   * @param {Object} toast - PrimeVue toast service
   */
  static showToast(error, toast) {
    error.messages.forEach((message) => {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      })
    })
  }
}

// services/core/error/api-error.js
/**
 * Classe de erro padronizada para erros de API
 */
export class ApiError extends Error {
  /**
   * @param {Object} options
   * @param {string} options.message
   * @param {string[]} [options.messages]
   * @param {number} options.status
   * @param {string} options.code
   * @param {Object} [options.meta]
   * @param {Error} [options.originalError]
   */
  constructor({ message, messages, status, code, meta, originalError }) {
    super(message)
    this.name = 'ApiError'
    this.messages = messages ?? [message]
    this.status = status
    this.code = code
    this.meta = meta
    this.originalError = originalError
  }
}
```

#### 5.1.3 Query Client Configuration (OPCIONAL)

> **Nota**: TanStack Query é OPCIONAL. Serviços podem funcionar sem ele.
> Migrar para TanStack Query é uma decisão por módulo, não obrigatória.

```javascript
// services/core/query/query-client.js
import { QueryClient } from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { CACHE_PRESETS } from './cache-config'

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CACHE_PRESETS.DEFAULT.staleTime,
        gcTime: CACHE_PRESETS.DEFAULT.gcTime,
        retry: CACHE_PRESETS.DEFAULT.retry,
        refetchOnWindowFocus: false,
        refetchOnMount: true
      },
      mutations: {
        retry: 1
      }
    }
  })

  // Configurar persistência (opcional)
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'azion-query-cache'
  })

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => query.meta?.persist === true
    }
  })

  return queryClient
}

// services/core/query/cache-config.js
export const CacheType = {
  GLOBAL: 'GLOBAL',           // Dados que mudam raramente
  SENSITIVE: 'SENSITIVE',     // Dados sensíveis
  PAGE_LIST: 'PAGE_LIST',     // Listas paginadas
  DETAIL: 'DETAIL',           // Detalhes de entidades
  REALTIME: 'REALTIME'        // Dados em tempo real
}

export const CACHE_PRESETS = {
  DEFAULT: {
    staleTime: 5 * 60 * 1000,      // 5 minutos
    gcTime: 10 * 60 * 1000,        // 10 minutos
    retry: 2
  },
  [CacheType.GLOBAL]: {
    staleTime: 30 * 60 * 1000,     // 30 minutos
    gcTime: 24 * 60 * 60 * 1000,   // 24 horas
    retry: 3
  },
  [CacheType.SENSITIVE]: {
    staleTime: 3 * 60 * 1000,      // 3 minutos
    gcTime: 5 * 60 * 1000,         // 5 minutos
    retry: 1
  },
  [CacheType.PAGE_LIST]: {
    staleTime: 5 * 60 * 1000,      // 5 minutos
    gcTime: 10 * 60 * 1000,        // 10 minutos
    retry: 2
  },
  [CacheType.DETAIL]: {
    staleTime: 10 * 60 * 1000,     // 10 minutos
    gcTime: 30 * 60 * 1000,        // 30 minutos
    retry: 2
  },
  [CacheType.REALTIME]: {
    staleTime: 0,                   // Sempre stale
    gcTime: 60 * 1000,             // 1 minuto
    retry: 1
  }
}
```

#### 5.1.4 Base Adapters

```javascript
// services/core/adapters/response-adapter.js

/**
 * Converte snake_case para camelCase
 * @param {string} str
 * @returns {string}
 */
export const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Converte camelCase para snake_case
 * @param {string} str
 * @returns {string}
 */
export const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Adapta response da API para formato da aplicação
 * @param {Object} data - Dados da API (snake_case)
 * @param {Object} options
 * @param {string[]} [options.fields] - Campos específicos para adaptar
 * @param {Object} [options.transformMap] - Transformações customizadas por campo
 * @param {boolean} [options.convertCase=true] - Converter snake_case para camelCase
 * @returns {Object}
 */
export function adaptResponse(data, options = {}) {
  const { fields, transformMap = {}, convertCase = true } = options

  const result = {}
  const source = data

  // Determinar campos a processar
  const keysToProcess = fields ?? Object.keys(source)

  for (const key of keysToProcess) {
    const sourceKey = convertCase ? camelToSnake(key) : key
    const value = source[sourceKey] ?? source[key]

    // Aplicar transformação customizada se existir
    const transformer = transformMap[key]
    if (transformer) {
      result[key] = transformer(value, source)
    } else if (convertCase) {
      result[snakeToCamel(key)] = value
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Adapta lista de items da API
 * @param {Object[]} data
 * @param {Object} options
 * @returns {Object[]}
 */
export function adaptListResponse(data, options = {}) {
  return data.map((item) => adaptResponse(item, options))
}

/**
 * Adapta response paginada da API
 * @param {Object} response - { results, count, next, previous }
 * @param {Object} options
 * @returns {{ data: Object[], total: number, hasNextPage: boolean, hasPreviousPage: boolean }}
 */
export function adaptPaginatedResponse(response, options = {}) {
  return {
    data: adaptListResponse(response.results, options),
    total: response.count,
    hasNextPage: !!response.next,
    hasPreviousPage: !!response.previous
  }
}

// services/core/adapters/request-adapter.js

/**
 * Converte objeto de params para query string
 * @param {Object} params
 * @param {Object} options
 * @param {boolean} [options.convertCase=true] - Converter camelCase para snake_case
 * @returns {URLSearchParams}
 */
export function buildQueryParams(params, options = {}) {
  const { convertCase = true } = options
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue

    const paramKey = convertCase ? camelToSnake(key) : key
    searchParams.set(paramKey, String(value))
  }

  return searchParams
}

/**
 * Adapta payload para formato da API (snake_case)
 * @param {Object} data
 * @param {Object} options
 * @param {Object} [options.transformMap] - Transformações customizadas
 * @param {string[]} [options.excludeFields] - Campos a excluir
 * @returns {Object}
 */
export function adaptRequest(data, options = {}) {
  const { transformMap = {}, excludeFields = [] } = options
  const result = {}

  for (const [key, value] of Object.entries(data)) {
    if (excludeFields.includes(key)) continue
    if (value === undefined) continue

    const apiKey = camelToSnake(key)
    const transformer = transformMap[key]

    result[apiKey] = transformer ? transformer(value, data) : value
  }

  return result
}
```

### 5.2 Domain Layer (Modules) - Exemplo: Domains

Cada módulo encapsula um domínio de negócio. **TanStack Query é opcional por módulo**.

#### 5.2.1 Adapters (Response)

```javascript
// services/domains/adapters/domain-response-adapter.js
import { adaptResponse } from '@/services/core/adapters'

/**
 * Transform map para converter response da API para formato da aplicação
 */
const domainTransformMap = {
  isActive: (value) => Boolean(value),
  cnameAccessOnly: (value) => Boolean(value),
  status: (_, item) => ({
    content: item.is_active ? 'Active' : 'Inactive',
    severity: item.is_active ? 'success' : 'danger'
  }),
  mtls: (_, item) => {
    if (!item.mtls_is_enabled) return undefined
    return {
      verification: item.mtls_verification,
      trustedCaCertificateId: item.mtls_trusted_ca_certificate_id,
      crlList: item.crl_list || []
    }
  }
}

/**
 * Adapter para responses de Domain
 */
export const DomainResponseAdapter = {
  /**
   * Adapta um domínio completo da API
   * @param {Object} httpResponse - Response do HTTP client
   * @returns {Object}
   */
  toDomain(httpResponse) {
    return adaptResponse(httpResponse.body, {
      transformMap: domainTransformMap
    })
  },

  /**
   * Adapta item para listagem
   * @param {Object} item - Item da API
   * @returns {Object}
   */
  toListItem(item) {
    return {
      id: item.id,
      name: item.name,
      domainName: item.domain_name,
      isActive: Boolean(item.is_active),
      environment: item.environment,
      edgeApplicationId: item.edge_application_id,
      status: {
        content: item.is_active ? 'Active' : 'Inactive',
        severity: item.is_active ? 'success' : 'danger'
      }
    }
  },

  /**
   * Adapta lista de domínios
   * @param {Object} httpResponse
   * @returns {{ body: Object[], count: number }}
   */
  toList(httpResponse) {
    const results = httpResponse.body.results || []
    return {
      body: results.map((item) => this.toListItem(item)),
      count: httpResponse.body.count || 0
    }
  }
}
```

#### 5.2.2 Adapters (Request)

```javascript
// services/domains/adapters/domain-request-adapter.js
import { adaptRequest } from '@/services/core/adapters'

/**
 * Adapter para requests de Domain
 */
export const DomainRequestAdapter = {
  /**
   * Adapta payload para criar domínio
   * @param {Object} params
   * @returns {Object}
   */
  toCreatePayload(params) {
    return {
      name: params.name,
      cnames: params.cnames || [],
      cname_access_only: params.cnameAccessOnly ?? false,
      digital_certificate_id: params.digitalCertificateId ?? null,
      edge_application_id: params.edgeApplicationId,
      edge_firewall_id: params.edgeFirewallId ?? null,
      is_mtls_enabled: params.mtls?.enabled ?? false,
      mtls_verification: params.mtls?.verification,
      mtls_trusted_ca_certificate_id: params.mtls?.trustedCaCertificateId ?? null,
      crl_list: params.mtls?.crlList ?? []
    }
  },

  /**
   * Adapta payload para editar domínio
   * @param {Object} params
   * @returns {Object}
   */
  toUpdatePayload(params) {
    const payload = {}

    if (params.name !== undefined) payload.name = params.name
    if (params.cnames !== undefined) payload.cnames = params.cnames
    if (params.cnameAccessOnly !== undefined) payload.cname_access_only = params.cnameAccessOnly
    if (params.digitalCertificateId !== undefined) payload.digital_certificate_id = params.digitalCertificateId
    if (params.edgeApplicationId !== undefined) payload.edge_application_id = params.edgeApplicationId

    if (params.mtls !== undefined) {
      payload.is_mtls_enabled = params.mtls.enabled
      payload.mtls_verification = params.mtls.verification
      payload.mtls_trusted_ca_certificate_id = params.mtls.trustedCaCertificateId ?? null
      payload.crl_list = params.mtls.crlList ?? []
    }

    return payload
  }
}
```

#### 5.2.3 Services (SEM TanStack Query - padrão atual)

```javascript
// services/domains/services/list-domains-service.js
import { httpClient } from '@/services/core/http'
import { DomainResponseAdapter } from '../adapters/domain-response-adapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'

/**
 * Lista domínios com paginação e filtros
 * @param {Object} params
 * @param {number} [params.page]
 * @param {number} [params.pageSize]
 * @param {string} [params.search]
 * @param {string} [params.ordering]
 * @returns {Promise<{ body: Object[], count: number }>}
 */
export const listDomainsService = async (params = {}) => {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page)
  if (params.pageSize) searchParams.set('page_size', params.pageSize)
  if (params.search) searchParams.set('search', params.search)
  if (params.ordering) searchParams.set('ordering', params.ordering)

  const url = searchParams.toString()
    ? `${makeDomainsBaseUrl()}?${searchParams}`
    : makeDomainsBaseUrl()

  const httpResponse = await httpClient.request({
    method: 'GET',
    url
  })

  return DomainResponseAdapter.toList(httpResponse)
}

// services/domains/services/load-domain-service.js
import { httpClient } from '@/services/core/http'
import { DomainResponseAdapter } from '../adapters/domain-response-adapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'

/**
 * Carrega um domínio por ID
 * @param {Object} params
 * @param {number} params.id
 * @returns {Promise<Object>}
 */
export const loadDomainService = async ({ id }) => {
  const httpResponse = await httpClient.request({
    method: 'GET',
    url: `${makeDomainsBaseUrl()}/${id}`
  })

  return DomainResponseAdapter.toDomain(httpResponse)
}

// services/domains/services/create-domain-service.js
import { httpClient } from '@/services/core/http'
import { DomainRequestAdapter } from '../adapters/domain-request-adapter'
import { DomainResponseAdapter } from '../adapters/domain-response-adapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'

/**
 * Cria um novo domínio
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export const createDomainService = async (params) => {
  const payload = DomainRequestAdapter.toCreatePayload(params)

  const httpResponse = await httpClient.request({
    method: 'POST',
    url: makeDomainsBaseUrl(),
    body: payload
  })

  return DomainResponseAdapter.toDomain(httpResponse)
}

// services/domains/services/edit-domain-service.js
import { httpClient } from '@/services/core/http'
import { DomainRequestAdapter } from '../adapters/domain-request-adapter'
import { DomainResponseAdapter } from '../adapters/domain-response-adapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'

/**
 * Edita um domínio existente
 * @param {Object} params
 * @param {number} params.id
 * @returns {Promise<Object>}
 */
export const editDomainService = async (params) => {
  const payload = DomainRequestAdapter.toUpdatePayload(params)

  const httpResponse = await httpClient.request({
    method: 'PATCH',
    url: `${makeDomainsBaseUrl()}/${params.id}`,
    body: payload
  })

  return DomainResponseAdapter.toDomain(httpResponse)
}

// services/domains/services/delete-domain-service.js
import { httpClient } from '@/services/core/http'
import { makeDomainsBaseUrl } from './make-domains-base-url'

/**
 * Deleta um domínio
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteDomainService = async (id) => {
  await httpClient.request({
    method: 'DELETE',
    url: `${makeDomainsBaseUrl()}/${id}`
  })
}
```

#### 5.2.4 Composables com TanStack Query (OPCIONAL)

> **Nota**: Só adicionar composables se o módulo for migrar para TanStack Query

```javascript
// services/domains/composables/use-domains.js
import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import { listDomainsService } from '../services/list-domains-service'
import { domainKeys } from '../keys/domain-keys'
import { CACHE_PRESETS, CacheType } from '@/services/core/query'

/**
 * Composable para listar domínios com cache
 * @param {Object} options
 * @param {import('vue').MaybeRef<Object>} [options.params]
 * @param {Object} [options.queryOptions]
 */
export function useDomains(options = {}) {
  const params = computed(() => toValue(options.params) ?? {})

  const query = useQuery({
    queryKey: computed(() => domainKeys.list(params.value)),
    queryFn: () => listDomainsService(params.value),
    ...CACHE_PRESETS[CacheType.PAGE_LIST],
    ...options.queryOptions
  })

  return {
    ...query,
    domains: computed(() => query.data.value?.body ?? []),
    total: computed(() => query.data.value?.count ?? 0)
  }
}

// services/domains/keys/domain-keys.js
/**
 * Factory de query keys para domains
 */
export const domainKeys = {
  all: ['domains'],
  lists: () => [...domainKeys.all, 'list'],
  list: (params = {}) => [...domainKeys.lists(), params],
  details: () => [...domainKeys.all, 'detail'],
  detail: (id) => [...domainKeys.details(), id]
}
```

#### 5.2.5 Barrel Export

```javascript
// services/domains/index.js

// Adapters
export { DomainRequestAdapter } from './adapters/domain-request-adapter'
export { DomainResponseAdapter } from './adapters/domain-response-adapter'

// Services
export { listDomainsService } from './services/list-domains-service'
export { loadDomainService } from './services/load-domain-service'
export { createDomainService } from './services/create-domain-service'
export { editDomainService } from './services/edit-domain-service'
export { deleteDomainService } from './services/delete-domain-service'

// Composables (opcional - só se usar TanStack Query)
// export { useDomains } from './composables/use-domains'
// export { domainKeys } from './keys/domain-keys'
```

---

## 6. Padrões e Convenções

### 6.1 Fluxo de Dados

```
┌──────────────────┐
│  Vue Component   │
│  (UI Layer)      │
└────────┬─────────┘
         │ usa service ou composable
         ▼
┌──────────────────────────────────────────────────┐
│  Opção A: Service Direto    │  Opção B: Composable│
│  (sem cache)                │  (com TanStack)     │
│  listDomainsService()       │  useDomains()       │
└────────┬────────────────────┴──────────┬─────────┘
         │                               │
         └───────────────┬───────────────┘
                         ▼
              ┌──────────────────┐
              │     Service      │
              │  (HTTP + Adapt)  │
              └────────┬─────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             │             ▼
┌──────────────┐       │    ┌──────────────┐
│   Request    │       │    │   Response   │
│   Adapter    │       │    │   Adapter    │
└──────┬───────┘       │    └───────┬──────┘
       │               │            │
       └───────────────┼────────────┘
                       ▼
              ┌──────────────────┐
              │   HTTP Client    │
              │      (core)      │
              └──────────────────┘
```

### 6.2 Convenções de Código

#### Naming

| Item | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos | kebab-case | `domain-response-adapter.js` |
| Classes/Adapters | PascalCase | `DomainResponseAdapter` |
| Services | camelCase function | `listDomainsService` |
| Composables | useCamelCase | `useDomains` |
| Query Keys | camelCase | `domainKeys.list()` |
| Constants | SCREAMING_SNAKE_CASE | `CACHE_PRESETS` |
| Testes | `{name}.test.js` | `domain-response-adapter.test.js` |

#### Imports

```javascript
// 1. External dependencies
import { useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

// 2. Core/shared modules
import { httpClient } from '@/services/core/http'
import { ErrorHandler } from '@/services/core/error'

// 3. Relative imports (same module)
import { DomainResponseAdapter } from '../adapters/domain-response-adapter'
import { makeDomainsBaseUrl } from './make-domains-base-url'
```

### 6.3 Error Handling Pattern

```javascript
// Nos services - lançar erro para ser tratado pelo chamador
export const createDomainService = async (params) => {
  const httpResponse = await httpClient.request({
    method: 'POST',
    url: makeDomainsBaseUrl(),
    body: DomainRequestAdapter.toCreatePayload(params)
  })

  // httpClient já trata erros via ErrorHandler
  return DomainResponseAdapter.toDomain(httpResponse)
}

// No componente Vue - try/catch com toast
const handleSubmit = async () => {
  try {
    const domain = await createDomainService(formData.value)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Domain ${domain.name} created successfully`
    })
    router.push(`/domains/${domain.id}`)
  } catch (error) {
    ErrorHandler.showToast(error, toast)
  }
}
```

---

## 7. Estratégia de Testes

### 7.1 Estrutura de Testes (Manter Padrão Atual)

Os testes ficam em `/src/tests/` separados do código fonte, seguindo o padrão já existente:

```
src/
├── services/
│   ├── core/
│   │   ├── http/
│   │   ├── error/
│   │   └── adapters/
│   │
│   ├── domains/
│   │   ├── adapters/
│   │   ├── services/
│   │   └── index.js
│   │
│   └── edge-applications/
│       └── ...
│
└── tests/                              # [EXISTENTE] Manter aqui
    └── services/
        ├── core/                       # Testes do core
        │   ├── http/
        │   │   └── http-client.test.js
        │   ├── error/
        │   │   └── error-handler.test.js
        │   └── adapters/
        │       ├── response-adapter.test.js
        │       └── request-adapter.test.js
        │
        ├── domains/                    # Testes do módulo domains
        │   ├── adapters/
        │   │   ├── domain-response-adapter.test.js
        │   │   └── domain-request-adapter.test.js
        │   └── services/
        │       ├── list-domains-service.test.js
        │       ├── load-domain-service.test.js
        │       ├── create-domain-service.test.js
        │       ├── edit-domain-service.test.js
        │       └── delete-domain-service.test.js
        │
        └── edge-applications/
            └── ...
```

### 7.2 Padrão `makeSut()` (System Under Test)

Manter o padrão já usado no projeto para consistência:

```javascript
// tests/services/domains/adapters/domain-response-adapter.test.js
import { describe, expect, it } from 'vitest'
import { DomainResponseAdapter } from '@/services/domains/adapters/domain-response-adapter'

// Fixtures de dados mock
const fixtures = {
  domainApiResponse: {
    id: 1,
    name: 'my-domain',
    domain_name: 'my-domain.azion.com',
    is_active: true,
    environment: 'production',
    edge_application_id: 123,
    mtls_is_enabled: false
  },
  domainListApiResponse: {
    body: {
      results: [
        { id: 1, name: 'domain-1', is_active: true },
        { id: 2, name: 'domain-2', is_active: false }
      ],
      count: 2
    }
  }
}

const makeSut = () => {
  const sut = DomainResponseAdapter
  return { sut, fixtures }
}

describe('DomainResponseAdapter', () => {
  describe('toListItem', () => {
    it('should correctly adapt a domain item for list display', () => {
      const { sut, fixtures } = makeSut()

      const result = sut.toListItem(fixtures.domainApiResponse)

      expect(result).toEqual({
        id: 1,
        name: 'my-domain',
        domainName: 'my-domain.azion.com',
        isActive: true,
        environment: 'production',
        edgeApplicationId: 123,
        status: {
          content: 'Active',
          severity: 'success'
        }
      })
    })

    it('should set status to Inactive when is_active is false', () => {
      const { sut } = makeSut()
      const inactiveDomain = { ...fixtures.domainApiResponse, is_active: false }

      const result = sut.toListItem(inactiveDomain)

      expect(result.status).toEqual({
        content: 'Inactive',
        severity: 'danger'
      })
    })
  })

  describe('toList', () => {
    it('should adapt list response with count', () => {
      const { sut, fixtures } = makeSut()

      const result = sut.toList(fixtures.domainListApiResponse)

      expect(result.body).toHaveLength(2)
      expect(result.count).toBe(2)
    })
  })
})
```

### 7.3 Testes de Adapters (Isolados - sem HTTP)

Adapters são funções puras, fáceis de testar:

```javascript
// tests/services/domains/adapters/domain-request-adapter.test.js
import { describe, expect, it } from 'vitest'
import { DomainRequestAdapter } from '@/services/domains/adapters/domain-request-adapter'

const makeSut = () => {
  const sut = DomainRequestAdapter
  return { sut }
}

describe('DomainRequestAdapter', () => {
  describe('toCreatePayload', () => {
    it('should convert camelCase params to snake_case payload', () => {
      const { sut } = makeSut()

      const params = {
        name: 'my-domain',
        edgeApplicationId: 123,
        cnameAccessOnly: true,
        digitalCertificateId: 456
      }

      const result = sut.toCreatePayload(params)

      expect(result).toEqual({
        name: 'my-domain',
        cnames: [],
        cname_access_only: true,
        digital_certificate_id: 456,
        edge_application_id: 123,
        edge_firewall_id: null,
        is_mtls_enabled: false,
        mtls_verification: undefined,
        mtls_trusted_ca_certificate_id: null,
        crl_list: []
      })
    })

    it('should handle mtls configuration when provided', () => {
      const { sut } = makeSut()

      const params = {
        name: 'secure-domain',
        edgeApplicationId: 123,
        mtls: {
          enabled: true,
          verification: 'enforce',
          trustedCaCertificateId: 789
        }
      }

      const result = sut.toCreatePayload(params)

      expect(result.is_mtls_enabled).toBe(true)
      expect(result.mtls_verification).toBe('enforce')
      expect(result.mtls_trusted_ca_certificate_id).toBe(789)
    })
  })

  describe('toUpdatePayload', () => {
    it('should only include provided fields in payload', () => {
      const { sut } = makeSut()

      const params = { name: 'updated-name' }

      const result = sut.toUpdatePayload(params)

      expect(result).toEqual({ name: 'updated-name' })
      expect(result).not.toHaveProperty('cnames')
      expect(result).not.toHaveProperty('edge_application_id')
    })
  })
})
```

### 7.4 Testes de Services (Mock do HTTP Client)

```javascript
// tests/services/domains/services/list-domains-service.test.js
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { listDomainsService } from '@/services/domains/services/list-domains-service'
import { httpClient } from '@/services/core/http'

// Mock do httpClient
vi.mock('@/services/core/http', () => ({
  httpClient: {
    request: vi.fn()
  }
}))

const fixtures = {
  apiResponse: {
    body: {
      results: [
        { id: 1, name: 'domain-1', is_active: true, domain_name: 'd1.azion.com' },
        { id: 2, name: 'domain-2', is_active: false, domain_name: 'd2.azion.com' }
      ],
      count: 2
    },
    statusCode: 200
  }
}

const makeSut = () => {
  const sut = listDomainsService
  return { sut }
}

describe('listDomainsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call httpClient with correct params', async () => {
    const { sut } = makeSut()
    vi.mocked(httpClient.request).mockResolvedValueOnce(fixtures.apiResponse)

    await sut({ page: 1, pageSize: 10 })

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: expect.stringContaining('page=1')
    })
    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: expect.stringContaining('page_size=10')
    })
  })

  it('should return adapted list with count', async () => {
    const { sut } = makeSut()
    vi.mocked(httpClient.request).mockResolvedValueOnce(fixtures.apiResponse)

    const result = await sut()

    expect(result.body).toHaveLength(2)
    expect(result.count).toBe(2)
    expect(result.body[0]).toHaveProperty('status')
    expect(result.body[0].isActive).toBe(true)
  })

  it('should handle search parameter', async () => {
    const { sut } = makeSut()
    vi.mocked(httpClient.request).mockResolvedValueOnce(fixtures.apiResponse)

    await sut({ search: 'test-domain' })

    expect(httpClient.request).toHaveBeenCalledWith({
      method: 'GET',
      url: expect.stringContaining('search=test-domain')
    })
  })
})
```

### 7.5 Testes de Error Handler

```javascript
// tests/services/core/error/error-handler.test.js
import { describe, expect, it, vi } from 'vitest'
import { ErrorHandler } from '@/services/core/error/error-handler'
import { ApiError } from '@/services/core/error/api-error'

const makeSut = () => {
  const sut = ErrorHandler
  return { sut }
}

describe('ErrorHandler', () => {
  describe('handle', () => {
    it('should return ApiError for axios errors with JSON:API format', () => {
      const { sut } = makeSut()
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [
              { detail: 'Name is required', source: { pointer: '/data/attributes/name' } },
              { detail: 'Invalid format', source: { pointer: '/data/attributes/email' } }
            ]
          }
        }
      }

      // Mock axios.isAxiosError
      vi.spyOn(require('axios'), 'isAxiosError').mockReturnValue(true)

      const result = sut.handle(axiosError)

      expect(result).toBeInstanceOf(ApiError)
      expect(result.status).toBe(400)
      expect(result.messages).toHaveLength(2)
      expect(result.messages[0]).toContain('Name')
    })

    it('should return generic error for unknown errors', () => {
      const { sut } = makeSut()
      const unknownError = new Error('Something went wrong')

      const result = sut.handle(unknownError)

      expect(result).toBeInstanceOf(ApiError)
      expect(result.status).toBe(500)
      expect(result.code).toBe('UNEXPECTED_ERROR')
    })
  })

  describe('showToast', () => {
    it('should call toast.add for each error message', () => {
      const { sut } = makeSut()
      const mockToast = { add: vi.fn() }
      const error = new ApiError({
        message: 'Error 1. Error 2',
        messages: ['Error 1', 'Error 2'],
        status: 400,
        code: 'BAD_REQUEST'
      })

      sut.showToast(error, mockToast)

      expect(mockToast.add).toHaveBeenCalledTimes(2)
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Error 1'
        })
      )
    })
  })
})
```

### 7.6 Testes Parametrizados com `it.each`

```javascript
// tests/services/core/adapters/response-adapter.test.js
import { describe, expect, it } from 'vitest'
import { snakeToCamel, camelToSnake, adaptResponse } from '@/services/core/adapters/response-adapter'

describe('snakeToCamel', () => {
  it.each([
    { input: 'snake_case', expected: 'snakeCase' },
    { input: 'my_long_variable_name', expected: 'myLongVariableName' },
    { input: 'already', expected: 'already' },
    { input: 'with_123_numbers', expected: 'with123Numbers' }
  ])('should convert "$input" to "$expected"', ({ input, expected }) => {
    expect(snakeToCamel(input)).toBe(expected)
  })
})

describe('camelToSnake', () => {
  it.each([
    { input: 'camelCase', expected: 'camel_case' },
    { input: 'myLongVariableName', expected: 'my_long_variable_name' },
    { input: 'already', expected: 'already' },
    { input: 'with123Numbers', expected: 'with123_numbers' }
  ])('should convert "$input" to "$expected"', ({ input, expected }) => {
    expect(camelToSnake(input)).toBe(expected)
  })
})

describe('adaptResponse', () => {
  it('should convert snake_case keys to camelCase by default', () => {
    const input = {
      user_name: 'John',
      is_active: true,
      created_at: '2024-01-01'
    }

    const result = adaptResponse(input)

    expect(result).toHaveProperty('userName', 'John')
    expect(result).toHaveProperty('isActive', true)
    expect(result).toHaveProperty('createdAt', '2024-01-01')
  })

  it('should apply transformMap functions', () => {
    const input = { is_active: 1, created_at: '2024-01-01' }
    const transformMap = {
      isActive: (value) => Boolean(value),
      createdAt: (value) => new Date(value)
    }

    const result = adaptResponse(input, { transformMap })

    expect(result.isActive).toBe(true)
    expect(result.createdAt).toBeInstanceOf(Date)
  })
})
```

### 7.7 Arquivo Centralizado de Query Keys

Para facilitar gerenciamento e evitar colisões:

```javascript
// services/core/query/query-keys.js
/**
 * Arquivo centralizado com todas as query keys do sistema
 * Facilita manutenção e evita duplicação
 */

export const queryKeys = {
  // Domains
  domains: {
    all: ['domains'],
    lists: () => [...queryKeys.domains.all, 'list'],
    list: (params = {}) => [...queryKeys.domains.lists(), params],
    details: () => [...queryKeys.domains.all, 'detail'],
    detail: (id) => [...queryKeys.domains.details(), id]
  },

  // Edge Applications
  edgeApplications: {
    all: ['edge-applications'],
    lists: () => [...queryKeys.edgeApplications.all, 'list'],
    list: (params = {}) => [...queryKeys.edgeApplications.lists(), params],
    details: () => [...queryKeys.edgeApplications.all, 'detail'],
    detail: (id) => [...queryKeys.edgeApplications.details(), id],
    // Sub-recursos
    origins: {
      all: (appId) => [...queryKeys.edgeApplications.detail(appId), 'origins'],
      list: (appId, params = {}) => [...queryKeys.edgeApplications.origins.all(appId), 'list', params],
      detail: (appId, originId) => [...queryKeys.edgeApplications.origins.all(appId), 'detail', originId]
    },
    rules: {
      all: (appId) => [...queryKeys.edgeApplications.detail(appId), 'rules'],
      list: (appId, phase, params = {}) => [...queryKeys.edgeApplications.rules.all(appId), phase, 'list', params]
    }
  },

  // Users
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: (params = {}) => [...queryKeys.users.lists(), params],
    details: () => [...queryKeys.users.all, 'detail'],
    detail: (id) => [...queryKeys.users.details(), id],
    current: () => [...queryKeys.users.all, 'current']
  },

  // Network Lists
  networkLists: {
    all: ['network-lists'],
    lists: () => [...queryKeys.networkLists.all, 'list'],
    list: (params = {}) => [...queryKeys.networkLists.lists(), params],
    details: () => [...queryKeys.networkLists.all, 'detail'],
    detail: (id) => [...queryKeys.networkLists.details(), id]
  },

  // Billing
  billing: {
    all: ['billing'],
    invoices: () => [...queryKeys.billing.all, 'invoices'],
    invoice: (id) => [...queryKeys.billing.invoices(), id],
    payment: () => [...queryKeys.billing.all, 'payment']
  },

  // Edge Functions
  edgeFunctions: {
    all: ['edge-functions'],
    lists: () => [...queryKeys.edgeFunctions.all, 'list'],
    list: (params = {}) => [...queryKeys.edgeFunctions.lists(), params],
    details: () => [...queryKeys.edgeFunctions.all, 'detail'],
    detail: (id) => [...queryKeys.edgeFunctions.details(), id]
  }

  // ... adicionar outros módulos conforme migração
}

// Helpers para invalidação
export const invalidateKeys = {
  /**
   * Invalida todas as listas de um módulo
   * @param {import('@tanstack/vue-query').QueryClient} queryClient
   * @param {string} module - Nome do módulo (ex: 'domains', 'users')
   */
  allLists: (queryClient, module) => {
    if (queryKeys[module]?.lists) {
      queryClient.invalidateQueries({ queryKey: queryKeys[module].lists() })
    }
  },

  /**
   * Remove um item específico do cache
   * @param {import('@tanstack/vue-query').QueryClient} queryClient
   * @param {string} module
   * @param {number|string} id
   */
  detail: (queryClient, module, id) => {
    if (queryKeys[module]?.detail) {
      queryClient.removeQueries({ queryKey: queryKeys[module].detail(id) })
    }
  }
}
```

---

## 8. Implementação de Referência

### 8.1 Uso em Componente Vue (SEM TanStack Query)

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import {
  listDomainsService,
  deleteDomainService
} from '@/services/domains'
import { ErrorHandler } from '@/services/core/error'

// State
const domains = ref([])
const total = ref(0)
const isLoading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const search = ref('')

// Composables
const toast = useToast()
const router = useRouter()

// Fetch domains
const fetchDomains = async () => {
  isLoading.value = true
  try {
    const result = await listDomainsService({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value
    })
    domains.value = result.body
    total.value = result.count
  } catch (error) {
    ErrorHandler.showToast(error, toast)
  } finally {
    isLoading.value = false
  }
}

// Delete domain
const isDeleting = ref(false)
const handleDelete = async (domain) => {
  isDeleting.value = true
  try {
    await deleteDomainService(domain.id)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Domain deleted successfully'
    })
    await fetchDomains() // Recarregar lista
  } catch (error) {
    ErrorHandler.showToast(error, toast)
  } finally {
    isDeleting.value = false
  }
}

const handleEdit = (domain) => {
  router.push(`/domains/${domain.id}/edit`)
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchDomains()
}

onMounted(fetchDomains)
</script>

<template>
  <div class="domains-list">
    <DataTable
      :value="domains"
      :loading="isLoading"
      :rows="pageSize"
      :totalRecords="total"
      :lazy="true"
      @page="handlePageChange($event.page + 1)"
    >
      <Column field="name" header="Name" />
      <Column field="domainName" header="URL" />
      <Column field="status" header="Status">
        <template #body="{ data }">
          <Tag :severity="data.status.severity">
            {{ data.status.content }}
          </Tag>
        </template>
      </Column>
      <Column header="Actions">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" @click="handleEdit(data)" />
          <Button
            icon="pi pi-trash"
            severity="danger"
            :loading="isDeleting"
            @click="handleDelete(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
```

### 8.2 Uso em Componente Vue (COM TanStack Query - Opcional)

```vue
<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useDomains } from '@/services/domains/composables/use-domains'
import { deleteDomainService } from '@/services/domains'
import { queryKeys } from '@/services/core/query/query-keys'
import { ErrorHandler } from '@/services/core/error'

// State
const page = ref(1)
const pageSize = ref(10)
const search = ref('')

// Composables
const toast = useToast()
const router = useRouter()
const queryClient = useQueryClient()

// Query - com cache automático
const { domains, total, isLoading, refetch } = useDomains({
  params: computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value
  }))
})

// Mutation para delete
const { mutate: deleteDomain, isPending: isDeleting } = useMutation({
  mutationFn: (id) => deleteDomainService(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.domains.lists() })
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Domain deleted successfully'
    })
  },
  onError: (error) => {
    ErrorHandler.showToast(error, toast)
  }
})

const handleDelete = (domain) => {
  deleteDomain(domain.id)
}

const handleEdit = (domain) => {
  router.push(`/domains/${domain.id}/edit`)
}

const handlePageChange = (newPage) => {
  page.value = newPage
}
</script>

<template>
  <!-- Mesmo template do exemplo anterior -->
</template>
```

---

## 9. Plano de Migração

### 9.1 Fases

```
┌────────────────────────────────────────────────────────────────┐
│                     FASE 1: INFRAESTRUTURA                     │
├────────────────────────────────────────────────────────────────┤
│ ✓ Criar estrutura /src/services/core/                          │
│ ✓ Implementar HttpClient unificado                             │
│ ✓ Implementar ErrorHandler centralizado                        │
│ ✓ Criar base adapters (request/response)                       │
│ ✓ Criar arquivo centralizado de query keys                     │
│ ✓ Criar testes para o core                                     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    FASE 2: MÓDULO PILOTO                       │
│                         (1-2 semanas)                          │
├────────────────────────────────────────────────────────────────┤
│ ✓ Escolher módulo de baixo risco (ex: domains)                 │
│ ✓ Implementar completo na nova arquitetura                     │
│ ✓ Criar testes unitários                                       │
│ ✓ Validar em produção                                          │
│ ✓ Documentar padrões e learnings                               │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   FASE 3: MIGRAÇÃO GRADUAL                     │
│                        (8-12 semanas)                          │
├────────────────────────────────────────────────────────────────┤
│ Priorizar por:                                                 │
│ 1. Serviços mais utilizados (edge-applications, users)         │
│ 2. Serviços com mais problemas reportados                      │
│ 3. Serviços simples (quick wins)                               │
│                                                                │
│ Migrar 3-5 módulos por sprint                                  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  FASE 4: LIMPEZA E FINALIZAÇÃO                 │
│                         (2-3 semanas)                          │
├────────────────────────────────────────────────────────────────┤
│ ✓ Remover código legado não utilizado                          │
│ ✓ Remover dependências desnecessárias                          │
│ ✓ Atualizar documentação                                       │
│ ✓ Treinar equipe                                               │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 Estratégia de Coexistência

Durante a migração, ambos os padrões coexistirão:

```javascript
// Serviço legado ainda funciona (manter funcionando)
import { listDomainsService } from '@/services/domains-services'

// Novo padrão na nova estrutura
import { listDomainsService } from '@/services/domains'

// Componentes existentes continuam funcionando
// Novos componentes DEVEM usar o novo padrão
```

### 9.3 Checklist de Migração por Módulo

- [ ] Criar estrutura de diretórios do módulo em `/src/services/{module}/`
- [ ] Criar adapters (request-adapter.js, response-adapter.js)
- [ ] Migrar services para nova estrutura usando adapters
- [ ] Adicionar query keys ao arquivo centralizado (se usar TanStack)
- [ ] Criar barrel export (index.js)
- [ ] Escrever testes unitários em `/src/tests/services/{module}/`
- [ ] Atualizar imports nos componentes que usam o serviço
- [ ] Verificar se testes passam
- [ ] Remover serviço legado após validação

### 9.4 Ordem de Migração Sugerida

| Prioridade | Módulo | Complexidade | Justificativa |
|------------|--------|--------------|---------------|
| 1 | domains | Média | Usado frequentemente, bom para validar padrão |
| 2 | edge-applications | Alta | Core do produto, alto impacto |
| 3 | users | Média | Usado em toda aplicação |
| 4 | network-lists | Baixa | Módulo simples, quick win |
| 5 | billing | Média | Isolado, baixo risco |
| 6 | edge-functions | Alta | Muitas features |
| ... | ... | ... | ... |

---

## 10. Benefícios Esperados

### 10.1 Métricas de Qualidade

| Métrica | Antes | Depois (esperado) |
|---------|-------|-------------------|
| Linhas de código duplicado | ~40% | ~10% |
| Cobertura de testes | ~50%* | ~70%+ |
| Tempo para adicionar novo endpoint | ~2h | ~30min |
| Consistência na transformação de dados | Baixa | Alta |
| Facilidade de debugging | Média | Alta |

*Coverage atual conforme vitest.config.js

### 10.2 Benefícios Técnicos

1. **Testabilidade** (Principal objetivo)
   - Adapters são funções puras, fáceis de testar isoladamente
   - Services podem ser testados com mock do httpClient
   - Padrão `makeSut()` já usado funciona perfeitamente
   - Separação clara facilita testes unitários

2. **Manutenibilidade**
   - Código organizado por domínio
   - Separação clara de responsabilidades
   - Fácil localizar e modificar código
   - Adapters centralizados evitam duplicação

3. **Error Handling Consistente**
   - Um lugar para tratar erros de API
   - Mensagens formatadas automaticamente
   - Integração com toast notifications

4. **Developer Experience**
   - JSDoc fornece documentação inline
   - Padrões consistentes reduzem decisões
   - Estrutura previsível

### 10.3 Benefícios de Negócio

1. **Velocidade de Entrega**
   - Menor tempo para implementar features
   - Menos bugs em produção
   - Refactoring mais seguro com testes

2. **Escalabilidade da Equipe**
   - Novos desenvolvedores produtivos mais rápido
   - Padrões claros reduzem code review
   - Menos dependência de conhecimento tribal

---

## 11. Referências

### Arquitetura e Padrões

- [Clean Architecture on Frontend](https://bespoyasov.me/blog/clean-architecture-on-frontend/) - Alex Bespoyasov
- [The Clean Architecture using React and TypeScript](https://medium.com/@rostislavdugin/the-clean-architecture-using-react-and-typescript-a832662af803) - Rostislav Dugin
- [Modularizing React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) - Martin Fowler
- [Hexagonal Architecture](https://dev.to/dyarleniber/hexagonal-architecture-and-clean-architecture-with-examples-48oi) - Dylan Iber
- [Clean Architecture for Frontend](https://the-amazing-gentleman-programming-book.vercel.app/en/book/Chapter08_Clean_Architecture_Front_End) - Gentleman Programming

### TanStack Query

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/vue/overview)
- [TanStack Query Service Layer Architecture](https://github.com/taisei-13046/tanstack-query-architecture)
- [Optimize Data Fetching with TanStack Vue Query](https://medium.com/@petrankar/master-efficient-data-fetching-in-vue3-with-tanstack-query-flow-diagram-code-walkthrough-f59bb6875247)
- [Supercharging Vue.js 3 with TanStack Query](https://lirantal.com/blog/supercharging-vuejs-3-app-tanstack-query-practical-refactoring-guide)

### Repository Pattern

- [Clean Architecture - Repository Pattern](https://medium.com/@bert.oneill/clean-architecture-incorporating-repository-pattern-388742e0b54e)
- [Repository Pattern Benefits](https://medium.com/@yasin162001/introduction-90f7f7e19d43)

### Frontend Architecture

- [Frontend Architecture Best Practices](https://www.sitepoint.com/react-architecture-best-practices/)
- [Elegant Frontend Architecture](https://michalzalecki.com/elegant-frontend-architecture/)
- [Clean Frontend Architecture Example](https://github.com/dimitridumont/clean-architecture-front-end)

---

## Decisão

**[ ] Aprovado** - Iniciar implementação conforme plano
**[ ] Aprovado com modificações** - Descrever modificações necessárias
**[ ] Rejeitado** - Motivo:
**[ ] Precisa mais discussão** - Agendar reunião técnica

---

*Documento criado por Claude Code em Janeiro 2026*
