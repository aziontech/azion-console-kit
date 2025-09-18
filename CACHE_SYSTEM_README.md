# Sistema de Cache com TanStack Query

## Visão Geral

Este sistema implementa um cache inteligente usando **TanStack Query** com persistência automática no `localStorage`. O cache é organizado em três camadas principais:

- **queryClient.js**: Cliente base com persistência automática
- **queryService.js**: Serviço simples com chaves por usuário
- **BaseService.js**: Serviço avançado com suporte a dados globais

## Arquitetura

### 1. queryClient.js - Cliente Base

```javascript
// Configuração do QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutos - dados considerados "frescos"
      gcTime: 10 * 60 * 1000,      // 10 minutos - tempo de vida na memória
      retry: 2,                     // 2 tentativas em caso de erro
      refetchOnWindowFocus: false,  // Não refetch ao focar na janela
      refetchOnReconnect: true      // Refetch ao reconectar
    }
  }
})
```

#### Funcionalidades Principais:

**Persistência Automática:**
- Salva automaticamente queries bem-sucedidas no `localStorage`
- Prefixo: `azion_cache_`
- Expiração: 24 horas
- Serialização inteligente de chaves complexas

**Dados Globais vs Pessoais:**
```javascript
const isGlobalData = (queryKey) => {
  const key = Array.isArray(queryKey) ? queryKey[1] : queryKey
  return key === 'global' || key === 'solutions' || key === 'marketplace'
}
```

**Enhanced Query Client:**
```javascript
export const enhancedQueryClient = {
  useQuery: (options) => {
    const cached = loadFromCache(queryKey)
    return useQuery({
      queryKey,
      queryFn,
      ...(cached && { initialData: cached }), // Carrega do cache se disponível
      ...restOptions
    })
  }
}
```

### 2. queryService.js - Serviço Simples

```javascript
export class QueryService {
  buildKey(key) {
    const { user_id: accountId } = useAccountStore().accountData
    const id = accountId || 'default'
    return Array.isArray(key) ? [id, ...key] : [id, key]
  }

  useQuery(key, queryFn, options = {}) {
    return useQuery({ 
      queryKey: this.buildKey(key), 
      queryFn, 
      ...options 
    })
  }
}
```

**Características:**
- Chaves sempre incluem o `userId` como prefixo
- Formato: `[userId, 'resource-name']`
- Invalidação por usuário específico

### 3. BaseService.js - Serviço Avançado

```javascript
export class BaseService {
  buildQueryKey(key, isGlobal = false) {
    const { user_id: accountId } = useAccountStore().accountData

    if (isGlobal) {
      return Array.isArray(key) ? ['global', ...key] : ['global', key]
    }

    const id = accountId || 'default'
    return Array.isArray(key) ? [id, ...key] : [id, key]
  }

  useGlobalQuery(key, queryFn, options = {}) {
    return this.useQuery(key, queryFn, { ...options, global: true })
  }
}
```

**Características:**
- Suporte a dados globais e pessoais
- Padrão Singleton
- Usa `enhancedQueryClient` para cache automático

## Estrutura das Chaves

### Dados Pessoais
```javascript
// QueryService
[userId, 'user-preferences']
[userId, 'billing-info']

// BaseService (mesmo comportamento)
[userId, 'user-preferences']
```

### Dados Globais
```javascript
// BaseService com global: true
['global', 'solutions']
['global', 'marketplace']
['global', 'public-config']
```

## Uso Prático

### QueryService (Simples)
```javascript
const queryService = new QueryService()

// Busca dados do usuário atual
const { data, isLoading } = queryService.useQuery(
  'user-preferences',
  () => fetchUserPreferences()
)

// Invalida todos os dados do usuário atual
queryService.invalidateCurrentAccount()
```

### BaseService (Avançado)
```javascript
const baseService = new BaseService()

// Dados pessoais
const { data: userData } = baseService.useQuery(
  'user-settings',
  () => fetchUserSettings()
)

// Dados globais
const { data: solutions } = baseService.useGlobalQuery(
  'solutions',
  () => fetchSolutions()
)
```

## Gerenciamento do Cache

### Utilitários de Limpeza
```javascript
import { cacheUtils } from './queryClient'

// Limpa todo o cache
cacheUtils.clear()

// Limpa apenas dados globais
cacheUtils.clearGlobal()
```

### Invalidação Inteligente
```javascript
// Invalida queries específicas
queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] })

// Invalida por padrão
queryClient.invalidateQueries({ 
  predicate: (query) => query.queryKey[0] === userId 
})
```

## Fluxo de Dados

1. **Primeira Requisição:**
   ```
   Component → useQuery → queryFn → API → Cache (localStorage) → UI
   ```

2. **Requisições Subsequentes:**
   ```
   Component → useQuery → Cache Hit → UI (instantâneo)
   Component → useQuery → Cache Miss → API → Cache → UI
   ```

3. **Atualização em Background:**
   ```
   Cache → UI (dados antigos)
   API → Cache → UI (dados atualizados)
   ```

## Configurações de Performance

| Configuração | Valor | Descrição |
|-------------|-------|-----------|
| `staleTime` | 5 min | Dados considerados "frescos" |
| `gcTime` | 10 min | Tempo de vida na memória |
| `retry` | 2x | Tentativas em caso de erro |
| Cache localStorage | 24h | Persistência no navegador |

## Boas Práticas

### 1. Nomenclatura de Chaves
```javascript
// ✅ Bom
['user', 'preferences']
['global', 'solutions']
[userId, 'billing-info']

// ❌ Evitar
['data']
['info']
['stuff']
```

### 2. Uso de Dados Globais
```javascript
// ✅ Use para dados que não mudam por usuário
baseService.useGlobalQuery('solutions', fetchSolutions)
baseService.useGlobalQuery('marketplace', fetchMarketplace)

// ❌ Não use para dados pessoais
baseService.useGlobalQuery('user-preferences', fetchUserPrefs)
```

### 3. Invalidação
```javascript
// ✅ Invalide após mutations
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
  }
})
```

## Debugging

### Verificar Cache
```javascript
// No console do navegador
Object.keys(localStorage)
  .filter(key => key.startsWith('azion_cache_'))
  .forEach(key => console.log(key, localStorage.getItem(key)))
```

### Logs de Debug
```javascript
// QueryService já tem log do accountId
console.log('🚀 ~ QueryService ~ buildKey ~ accountId:', id)
```

## Troubleshooting

### Cache não está funcionando
1. Verifique se o `localStorage` está disponível
2. Confirme se a chave está sendo serializada corretamente
3. Verifique se os dados não expiraram (24h)

### Dados não atualizam
1. Verifique o `staleTime` (5 min)
2. Force invalidação: `queryClient.invalidateQueries()`
3. Limpe o cache: `cacheUtils.clear()`

### Performance issues
1. Reduza o `staleTime` para dados que mudam frequentemente
2. Use `gcTime` menor para dados grandes
3. Considere usar `select` para transformar dados
