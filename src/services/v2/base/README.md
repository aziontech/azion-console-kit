# Sistema de Cache Avançado para @base/

## Visão Geral

Este documento descreve a implementação de um sistema de cache avançado que utiliza **IndexedDB como padrão** com **fallback para localStorage**, integrado com TanStack Query para diferentes cenários de persistência de dados.

## Objetivos

- Utilizar IndexedDB por padrão com fallback automático para localStorage
- Integração completa com TanStack Query para invalidações automáticas
- Suporte a múltiplos cenários de cache com diferentes níveis de persistência
- Invalidação automática do cache em novas versões do sistema
- API simples e abstrata para uso nos serviços
- Possibilidade de usar tambem metodos para cache de dados globais e dados do usuario sem o uso do tanstack query

## Cenários de Cache

### 1. Global Persistente
- **Descrição**: Cache mantido mesmo após reload/restart do browser
- **Uso**: Dados globais como configurações de sistema
- **Duração**: Persistente até invalidação manual ou nova versão ou expiracao definida no tanstack query
- **Exemplo**: `global.persistent`

### 2. Global Não Persistente  
- **Descrição**: Cache mantido apenas durante a sessão do browser
- **Uso**: Dados temporários globais que não precisam persistir
- **Duração**: Até fechar o browser ou trocar de aba ou expiracao definida no tanstack query
- **Exemplo**: `global.session`

### 3. User Persistente
- **Descrição**: Cache por usuário mantido mesmo após reload
- **Uso**: Configurações específicas do usuário, preferências
- **Duração**: Persistente até logout ou nova versão ou expiracao definida no tanstack query
- **Exemplo**: `user.persistent`

### 4. User Não Persistente
- **Descrição**: Cache por usuário apenas durante a sessão
- **Uso**: Dados temporários do usuário
- **Duração**: Até logout ou reload ou expiracao definida no tanstack query
- **Exemplo**: `user.session`

## API de Uso

### Configuração Simples

```javascript
import { BaseService } from '@/services/v2/base/BaseService'

class MyService extends BaseService {
  // Método 1: Usando enum de configuração pré-definida
  async getData() {
    return this.useQuery(
      ['my-data'], 
      fetchData,
      { cacheType: 'user.persistent' }
    )
  }

  // Método 2: Configuração customizada
  async getGlobalData() {
    return this.useQuery(
      ['global-data'], 
      fetchGlobalData,
      { 
        cacheConfig: {
          type: 'global',
          persistent: true,
          ttl: 60 * 60 * 1000, // 1 hora
        }
      }
    )
  }
}
```

### Configurações Pré-definidas

```javascript
const cacheTypes = {
  'global.persistent': {
    type: 'global',
    persistent: true,
    storage: 'auto',
    ttl: 24 * 60 * 60 * 1000 // 24 horas
  },
  'global.session': {
    type: 'global', 
    persistent: false,
    storage: 'session',
    ttl: 1 * 60 * 60 * 1000 // 12 hora
  },
  'user.persistent': {
    type: 'user',
    persistent: true,
    storage: 'auto',
    ttl: 12 * 60 * 60 * 1000 // 12 horas
  },
  'user.session': {
    type: 'user',
    persistent: false,
    storage: 'session',
    ttl: 30 * 60 * 1000 // 10 minutos
  }
}
```

## Integração com TanStack Query

### Invalidações Automáticas

```javascript
// Quando TanStack Query invalida uma query
queryClient.invalidateQueries(['user-data'])

// O sistema de cache automaticamente:
// 1. Remove do cache local (IndexedDB/localStorage)
// 2. Força refetch dos dados
// 3. Atualiza o cache com novos dados
```

### Mutations e Cache

```javascript
// Após uma mutation bem-sucedida
const mutation = useMutation({
  mutationFn: updateUserData,
  onSuccess: (data, variables) => {
    // Automaticamente invalida cache relacionado
    queryClient.invalidateQueries(['user-data', variables.userId])
  }
})
```

## Versionamento e Limpeza

### Sistema de Versões

```javascript
// versionManager.js detecta mudanças de versão
const CURRENT_VERSION = '1.2.0'

// Em nova versão:
// 1. Limpa todo cache existente
// 2. Reinicia com cache limpo
// 3. Permite migração de dados se necessário
```

### Estratégias de Limpeza

- **Automática**: Em novas versões do sistema
- **Manual**: Via API de limpeza
- **Por TTL**: Baseado no tempo de vida configurado
- **Por Espaço**: Quando IndexedDB atinge limite

## Próximos Passos

1. Implementar storage adapters (IndexedDB, localStorage, sessionStorage)
2. Criar cache manager com configurações pré-definidas
3. Implementar version manager para limpeza automática
4. Integrar com TanStack Query para invalidações
5. Atualizar BaseService com nova API

**Nota**: Este sistema manterá compatibilidade com o sistema atual durante a migração, permitindo adoção gradual nos serviços existentes.
