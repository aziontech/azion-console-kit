# Cache Sync & Prefetch System

> Sistema de sincronização de cache via SSE com prefetch atrasado e agregação por janela fixa.

## Visão Geral

O sistema resolve o problema de múltiplas requisições quando eventos SSE chegam em sequência rápida. Em vez de refetchar imediatamente cada invalidação, o sistema:

1. **Invalida sem refetch** (`refetchType: 'none'`)
2. **Agrega eventos** por 10 segundos (janela fixa iniciada no primeiro evento)
3. **Prefetch apenas queries stale** ao final do timer

---

## Arquitetura

### Componentes

| Componente          | Responsabilidade                | Arquivo                         |
| ------------------- | ------------------------------- | ------------------------------- |
| `SSEClient`         | Conexão SSE com servidor        | `sse-client.js`                 |
| `CacheSyncService`  | Orquestra todo o fluxo          | `cache-sync-service.js`         |
| `CacheInvalidator`  | Converte eventos → queryKeys    | `cache-invalidator.js`          |
| `InvalidationMap`   | Mapeia resources → queryKeys    | `invalidation-map.js`           |
| `PrefetchScheduler` | Timer + agregação (janela fixa) | `prefetch-scheduler.js`         |
| `PrefetchExecutor`  | Coleta + executa prefetch       | `prefetch-executor.js`          |
| `PrefetchRegistry`  | queryKey → queryFn mapping      | `prefetch-query-fn-registry.js` |

---

## Fluxo de Chamadas

```mermaid
sequenceDiagram
    autonumber
    participant SSE as SSE Server
    participant SSEClient as SSEClient
    participant CacheSync as CacheSyncService
    participant Invalidator as CacheInvalidator
    participant InvalidationMap as InvalidationMap
    participant QueryCache as TanStack QueryCache
    participant Scheduler as PrefetchScheduler
    participant Executor as PrefetchExecutor
    participant Registry as PrefetchRegistry
    participant Service as Service Layer
    participant Broadcast as BroadcastManager

    Note over SSE, Broadcast: === EVENTO SSE CHEGA ===

    SSE->>SSEClient: Event "activity"
    SSEClient->>CacheSync: emit("activity", event)

    Note over CacheSync, Invalidator: 1. INVALIDAÇÃO
    CacheSync->>Invalidator: invalidate(event)
    Invalidator->>InvalidationMap: getKeysForResource(resourceType, activityType, resourceId)
    InvalidationMap-->>Invalidator: [['application']]

    Invalidator->>QueryCache: invalidateQueries({ queryKey: ['application'], refetchType: 'none' })
    Note right of QueryCache: Queries marcadas como stale<br/>SEM refetch automático

    Invalidator-->>CacheSync: [['application']]

    Note over CacheSync, Scheduler: 2. AGENDAMENTO
    CacheSync->>Scheduler: schedule([['application']])
    Note right of Scheduler: Adiciona ao Set pendente<br/>Inicia timer apenas no 1o evento

    Note over CacheSync, Broadcast: 3. BROADCAST (cross-tab)
    CacheSync->>Broadcast: send('CACHE_INVALIDATION', { keys: [['application']] })

    Note over Scheduler: ... 10 segundos depois ...

    Note over Scheduler, Executor: 4. EXECUÇÃO DO PREFETCH
    Scheduler->>Executor: execute([['application']])

    Executor->>QueryCache: findAll({ queryKey: ['application'] })
    Note right of QueryCache: Retorna TODAS queries<br/>que começam com ['application', ...]
    QueryCache-->>Executor: [Query('application', {page:1}, 'list'), Query('application', '123')]

    loop Para cada query stale
        Executor->>Executor: shouldPrefetch(query)
        Note right of Executor: ✓ isStale<br/>✓ !isFetching<br/>✓ !error<br/>✓ has queryFn
    end

    Executor->>Registry: has(queryKey)
    Registry-->>Executor: true

    Executor->>Registry: get(queryKey)
    Registry-->>Executor: queryFn

    Executor->>Service: queryFn(queryKey)
    Note right of Service: Ex: edgeAppService.listEdgeApplicationsService(params)
    Service->>Service: HTTP GET /v4/workspace/applications
    Service-->>Executor: { body: [...], count: 10 }

    Executor->>QueryCache: prefetchQuery({ queryKey, queryFn })
    Note right of QueryCache: Dados atualizados no cache<br/>Queries marcadas como fresh

    Executor-->>Scheduler: Promise settled
```

---

## Fluxo Simplificado

```mermaid
flowchart TD
    subgraph SSE["SSE Layer"]
        A[SSE Event<br/>activity] --> B[SSEClient]
    end

    subgraph Invalidation["Invalidação"]
        B --> C[CacheSyncService]
        C --> D[CacheInvalidator]
        D --> E{"InvalidationMap<br/>resource -> queryKey"}
        E --> F["invalidateQueries()<br/>refetchType: 'none'"]
    end

    subgraph Aggregation["Agregação"]
        F --> G[PrefetchScheduler]
        G --> H["Set pendente<br/>{queryKeys...}"]
        H --> I["Timer 10s<br/>(janela fixa)"]
    end

    subgraph Prefetch["Prefetch"]
        I --> J[PrefetchExecutor]
        J --> K["findAll(queryKey)<br/>Partial match"]
        K --> L{Query stale?}
        L -->|Sim| M["Registry.get(queryKey)"]
        L -->|Não| N[Skip]
        M --> O["Service.queryFn()"]
        O --> P["prefetchQuery()"]
    end

    subgraph Result["Resultado"]
        P --> Q[Cache atualizado<br/>Dados fresh]
    end
```

---

## Detalhamento por Fase

### Fase 1: Recebimento e Invalidação

```mermaid
flowchart LR
    subgraph Input
        A["SSE Event:<br/>{resource.type: 'Application',<br/>activity_type: 'edited',<br/>metadata.id: 1772656941}"]
    end

    subgraph Mapping
        B[InvalidationMap]
        C["resourceType → queryKey<br/>'application' → ['application']"]
    end

    subgraph Cache
        D["queryCache.invalidateQueries()<br/>refetchType: 'none'"]
        E["Query marcada stale<br/>SEM refetch"]
    end

    A --> B --> C --> D --> E
```

**Ponto importante:** `refetchType: 'none'` é crucial! Sem isso, cada invalidação dispararia um refetch imediato.

### Fase 2: Agendamento com Janela Fixa

```mermaid
flowchart TD
    subgraph Events["Eventos SSE (rajada)"]
        E1["Evento 1 @ t=0s<br/>['application']"]
        E2["Evento 2 @ t=2s<br/>['application']"]
        E3["Evento 3 @ t=5s<br/>['firewall']"]
        E4["Evento 4 @ t=8s<br/>['application']"]
    end

    subgraph Scheduler["PrefetchScheduler"]
        S1["pendingKeys = Set()"]
        S2["timer = null"]

        E1 --> S1
        S1 --> S2

        E2 --> S1
        S1 --> |"timer mantido"| S2

        E3 --> S1
        S1 --> |"timer mantido"| S2

        E4 --> S1
        S1 --> |"timer mantido"| S2
    end

    subgraph Timer["Após 10s do primeiro evento"]
        T1["Timer dispara @ t=10s"]
        T2["Set: {['application'], ['firewall']}"]
        T3["Executor.execute(all)"]
    end

    S2 --> |"10s"| T1 --> T2 --> T3
```

**Benefício da janela fixa:** 4 eventos = **1 único prefetch** ao invés de 4 requests.

### Fase 3: Coleta de Queries Stale

```mermaid
flowchart TD
    subgraph Input
        A["queryKeys: [['application']]"]
    end

    subgraph QueryCache["TanStack QueryCache"]
        Q1["['application', {page: 1}, 'list']<br/>stale: true, fetching: false"]
        Q2["['application', {page: 2}, 'list']<br/>stale: true, fetching: false"]
        Q3["['application', '1772656941']<br/>stale: false (fresh)"]
        Q4["['application', {page: 1}, 'list']<br/>fetching: true"]
    end

    subgraph FindAll
        B["findAll(['application'])<br/>Partial/prefix match"]
        B --> C["Retorna: Q1, Q2, Q3, Q4"]
    end

    subgraph Filter
        D{shouldPrefetch?}
        D -->|"stale && !fetching"| E[Q1 ✓]
        D -->|"stale && !fetching"| F[Q2 ✓]
        D -->|"!stale"| G[Q3 ✗]
        D -->|"fetching"| H[Q4 ✗]
    end

    subgraph Output
        I["staleQueries: [<br/>['application', {page: 1}, 'list'],<br/>['application', {page: 2}, 'list']<br/>]"]
    end

    A --> B --> C --> D
    E --> I
    F --> I
```

**Ponto importante:** `findAll()` faz match parcial! `['application']` encontra todas as queries que começam com esse prefixo.

### Fase 4: Execução do Prefetch

```mermaid
flowchart TD
    subgraph Input
        A["queryKey: ['application', {page: 1}, 'list']"]
    end

    subgraph Registry["PrefetchRegistry"]
        B["Padrão: ['application']<br/>queryFn: (key) => edgeAppService.listEdgeApplicationsService(key[1])"]
    end

    subgraph Execution
        C["queryFn(queryKey)"]
        D["edgeAppService.listEdgeApplicationsService({page: 1})"]
        E["HTTP GET /v4/workspace/applications?page=1"]
        F["Response: {body: [...], count: 10}"]
    end

    subgraph Cache["TanStack QueryCache"]
        G["prefetchQuery({<br/>queryKey,<br/>queryFn<br/>})"]
        H["Cache atualizado<br/>Query fresh"]
    end

    A --> B --> C --> D --> E --> F --> G --> H
```

---

## Cross-Tab Synchronization

```mermaid
sequenceDiagram
    autonumber
    participant Tab1 as Tab 1 (Primary)
    participant Tab2 as Tab 2 (Secondary)
    participant Broadcast as BroadcastChannel
    participant Cache as QueryCache

    Note over Tab1, Tab2: Tab 1 é a primary (recebe SSE)

    Tab1->>Tab1: Recebe SSE event
    Tab1->>Tab1: Invalida localmente
    Tab1->>Tab1: Agenda prefetch
    Tab1->>Broadcast: send('CACHE_INVALIDATION', { keys })

    Broadcast->>Tab2: on('CACHE_INVALIDATION')
    Tab2->>Cache: invalidateQueries({ queryKey, refetchType: 'none' })
    Tab2->>Tab2: Agenda prefetch local

    Note over Tab1, Tab2: Ambas tabs fazem prefetch independente<br/>apenas a primary faz request HTTP
```

---

## QueryKey Matching

### Estrutura das QueryKeys

```javascript
// Listagem
;['application', { page: 1, pageSize: 10, ordering: '-last_modified' }, 'list', null][
  // Detalhe
  ('application', '1772656941')
][
  // Sub-recursos
  ('application', '1772656941', 'origins', 'list', { page: 1 })
][('application', '1772656941', 'rules-engine', 'detail', '617789')]
```

### Invalidação vs Cache

```mermaid
flowchart LR
    subgraph Invalidação
        A["['application']<br/>(do evento SSE)"]
    end

    subgraph Cache["Queries no Cache"]
        B["['application', {page:1}, 'list']"]
        C["['application', {page:2}, 'list']"]
        D["['application', '1772656941']"]
        E["['application', '123456']"]
    end

    subgraph Match
        F["findAll(['application'])"]
        G["Retorna: B, C, D, E<br/>(TODAS começam com 'application')"]
    end

    A --> F --> G
    B --> G
    C --> G
    D --> G
    E --> G
```

---

## Configuração

### Timer de Agregação

```javascript
// Valor padrão: 10 segundos
const DEFAULT_DEBOUNCE_MS = 10000 // nome legado; representa a janela fixa

// Pode ser customizado
const scheduler = new PrefetchScheduler({
  executor,
  debounceMs: 5000 // 5 segundos
})
```

### Registry de QueryFns

```javascript
// Registrar nova queryFn
prefetchRegistry.register(['meu-recurso'], async (queryKey) => {
  const { meuService } = await import('./meu-service')

  // Extrair parâmetros da queryKey
  if (queryKey[2] === 'list') {
    const params = queryKey[1] || {}
    return meuService.list(params)
  }

  // Detalhe
  const id = queryKey[1]
  return meuService.load({ id })
})
```

---

## Logs e Debug

### Logs Disponíveis

```
[PrefetchScheduler] Scheduled keys: 1
[PrefetchScheduler] Pending keys: 2
[PrefetchScheduler] Timer fired, processing 2 keys
[PrefetchExecutor] Collected 2 stale queries
[PrefetchExecutor] Stale queries: [['application', {...}, 'list'], ['firewall', {...}, 'list']]
[PrefetchExecutor] Prefetching: ['application', {...}, 'list']
[PrefetchRegistry] Registered 25 queryFn patterns
```

### Debug no Browser

```javascript
// Ver queries stale no cache
const qc = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.stores.queryClient
qc.getQueryCache().findAll({ stale: true })

// Ver padrões registrados
window.__PREFETCH_REGISTRY__?.getAllPatterns()

// Forçar execução do timer
// (adicionar ao scheduler se necessário)
```

---

## Edge Cases Tratados

| Cenário                          | Comportamento                         |
| -------------------------------- | ------------------------------------- |
| Query não existe no cache        | Ignora (não há dados para atualizar)  |
| Query já está sendo fetchada     | Pula (isFetching = true)              |
| Query está em erro               | Pula (status = 'error')               |
| Query não tem queryFn registrada | Log warning + pula                    |
| Múltiplos eventos mesma key      | Set deduplica automaticamente         |
| Novo evento durante timer        | Timer não reinicia; apenas agrega key |
| Erro no prefetch                 | Log error + continua outras queries   |
| Tab fica inativa                 | Timer pode não disparar (aceitável)   |

---

## Benefícios

| Antes                       | Depois                                |
| --------------------------- | ------------------------------------- |
| 1 evento = 1 request HTTP   | N eventos = 1 request HTTP            |
| Refetch imediato            | Prefetch após 10s                     |
| Múltiplas queries refetcham | Apenas queries stale são prefetchadas |
| Race conditions possíveis   | Janela fixa reduz rajadas e colisões  |

---

## Arquivos

```
src/services/v2/base/cache-sync/
├── cache-sync-service.js       # Orquestrador principal
├── cache-invalidator.js        # Invalidação de queries
├── invalidation-map.js         # Mapeamento resource → queryKey
├── prefetch-scheduler.js       # Timer + agregação
├── prefetch-executor.js        # Execução de prefetch
├── prefetch-query-fn-registry.js # Registro de queryFns
└── prefetch-registrations.js   # QueryFns registradas
```
