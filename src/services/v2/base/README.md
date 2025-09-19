# Sistema Base v2 - TanStack Query + Cache Persistente

Sistema de serviços com cache inteligente usando TanStack Query integrado com IndexedDB/localStorage.

## 🏗️ Arquitetura

```
src/services/v2/base/
├── BaseService.js        # Classe base para todos os serviços
├── queryClient.js        # TanStack Query + cache persistente
├── httpService.js        # Cliente HTTP com AbortController
├── httpClient.js         # Wrapper do Axios
├── abortManager.js       # Gerenciamento de cancelamento
├── cache/
│   ├── CacheManager.js   # IndexedDB + localStorage fallback
│   ├── VersionManager.js # Limpeza automática por versão
│   └── CacheConfig.js    # Configurações de cache
└── index.js             # Exports + inicialização automática
```

## 🚀 Uso Básico

### 1. Criar um Serviço

```javascript
import { BaseService, CACHE_TYPES } from '@/services/v2/base'

export class UserService extends BaseService {
  // Cache nativo TanStack Query (apenas memória)
  getUsers() {
    return this.useQuery(['users'], () => this.http.get('/users'))
  }

  // Cache persistente do usuário (12h, IndexedDB)
  getUserProfile() {
    return this.useUserQuery(['profile'], () => this.http.get('/profile'))
  }

  // Cache persistente global (24h, IndexedDB)
  getSystemConfig() {
    return this.useGlobalQuery(['config'], () => this.http.get('/config'))
  }

  // Mutation com invalidação automática
  updateProfile(data) {
    return this.useMutation(
      () => this.http.put('/profile', data),
      { invalidateQueries: [['profile'], ['users']] }
    )
  }
}
```

### 2. Usar no Componente

```javascript
import { userService } from '@/services/user-service'

export default {
  setup() {
    // Dados ficam em cache automaticamente
    const { data: users, isLoading } = userService.getUsers()
    const { data: profile } = userService.getUserProfile()
    
    const updateProfileMutation = userService.updateProfile()
    
    return { users, profile, isLoading, updateProfileMutation }
  }
}
```

## 📦 Tipos de Cache

| Método | TTL | Persistente | Escopo | Uso |
|--------|-----|-------------|---------|-----|
| `useQuery()` | 5min | ❌ | Memória | Cache padrão TanStack Query |
| `useUserQuery()` | 12h | ✅ | Por usuário | Dados específicos do usuário |
| `useGlobalQuery()` | 24h | ✅ | Global | Configurações, dados compartilhados |

## 🔧 Métodos Disponíveis

### BaseService

```javascript
// Queries
this.useQuery(key, fn, options)           // Cache nativo TanStack Query
this.useUserQuery(key, fn, options)       // Cache persistente usuário  
this.useGlobalQuery(key, fn, options)     // Cache persistente global
this.useQueryWithCache(key, fn, options)  // Pré-carrega cache

// Mutations  
this.useMutation(fn, { invalidateQueries: [...] })

// Gerenciamento
this.invalidateQueries(pattern)
this.clearCache()

// HTTP
this.http.request({ method, url, body, params })
```

### Configuração Avançada

```javascript
// Cache personalizado
this.useQuery(['data'], fetchData, {
  persistent: {
    type: CACHE_TYPES.USER_PERSISTENT,
    ttl: 2 * 60 * 60 * 1000  // 2 horas
  },
  staleTime: 10 * 60 * 1000    // 10 min fresh
})

// Query keys com objetos (suportado)
this.useGlobalQuery(['solutions', { group: 'web', type: 'all' }], fetchSolutions)
```

## ⚙️ Configurações TanStack Query

- **staleTime**: 5 minutos (dados considerados fresh)
- **gcTime**: 10 minutos (tempo em memória após unused)
- **retry**: 2 tentativas em caso de erro
- **refetchOnWindowFocus**: false
- **refetchOnReconnect**: true

## 🗄️ Sistema de Cache

### Cache Persistente

- **IndexedDB** como storage principal
- **localStorage** como fallback automático
- **TTL** (Time To Live) respeitado automaticamente
- **Versionamento** - limpa cache em atualizações da app

### Fluxo de Cache

1. **Query executada** → Verifica cache TanStack Query
2. **Se não existe** → Verifica cache persistente (IndexedDB/localStorage)
3. **Se existe e válido** → Retorna dados do cache (sem request)
4. **Se inválido/inexistente** → Executa request + salva no cache

### Serialização de Keys

Query keys com objetos são serializadas automaticamente:
```javascript
['solutions', { group: 'web', type: 'all' }]
// Vira: "solutions_{"group":"web","type":"all"}"
```

## 🚨 Invalidação de Cache

### Automática
- **Nova versão** da aplicação limpa todo cache
- **TTL expirado** remove entrada automaticamente
- **Mutations** invalidam queries relacionadas

### Manual
```javascript
// Invalidar queries específicas
this.invalidateQueries(['users'])
this.invalidateQueries([['users'], ['profile']])

// Limpar todo cache
this.clearCache()
```

## 🔄 Migração de Serviços Existentes

### Passo 1: Herdar de BaseService
```javascript
// Antes
class MyService {
  async getData() {
    return axios.get('/data')
  }
}

// Depois
class MyService extends BaseService {
  async getData() {
    return this.useQuery(['data'], () => this.http.get('/data'))
  }
}
```

### Passo 2: Adicionar Cache Conforme Necessário
```javascript
// Cache básico (memória)
getUsers() {
  return this.useQuery(['users'], () => this.http.get('/users'))
}

// Cache persistente usuário
getUserProfile() {
  return this.useUserQuery(['profile'], () => this.http.get('/profile'))
}

// Cache persistente global
getSystemConfig() {
  return this.useGlobalQuery(['config'], () => this.http.get('/config'))
}
```

## 📊 Monitoramento

### DevTools TanStack Query
```javascript
import { ReactQueryDevtools } from '@tanstack/vue-query-devtools'
// Adicione no seu App.vue para debug
```

### Cache no DevTools
- **Application → IndexedDB → azion_cache_db** - Cache persistente
- **Application → Local Storage** - Fallback cache
- **Console** - Logs de inicialização do cache

## 🎯 Resumo dos Benefícios

- ✅ **Cache automático** - TanStack Query + IndexedDB
- ✅ **Zero configuração** - Funciona out-of-the-box  
- ✅ **Evita requests** desnecessárias
- ✅ **Offline-first** - Dados persistem entre sessões
- ✅ **Versionamento** automático
- ✅ **API simples** - Apenas 3 métodos principais
- ✅ **Migração fácil** - Compatible com código existente
- ✅ **Performance** - Dados carregam instantaneamente do cache

**Sistema pronto para produção com cache inteligente e performance otimizada!**