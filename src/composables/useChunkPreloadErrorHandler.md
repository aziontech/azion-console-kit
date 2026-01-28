# useChunkPreloadErrorHandler

Composable para tratar erros de **version skew** após novos deployments.

## O Problema

Quando o Vite faz build da aplicação, ele gera chunks com hash no nome (ex: `UserDetails-BZBpiADS.js`). Após um novo deploy:

1. Os chunks antigos são deletados do servidor
2. Usuários com abas abertas ainda referenciam os chunks antigos
3. Ao navegar, o browser tenta carregar chunks que não existem mais
4. Resultado: erro 404 e aplicação quebrada

## A Solução

O Vite dispara um evento `vite:preloadError` quando falha ao carregar chunks. Este composable:

1. Captura esses eventos
2. Correlaciona com erros do Vue Router
3. Faz reload automático para buscar a versão atualizada

## Cenários de Aplicação

| Cenário | Comportamento |
|---------|---------------|
| Usuário com aba aberta há dias navega para nova rota | Reload automático para a rota destino |
| Chunk falha mas reload também falha (problema de rede) | Para após 3 tentativas, evita loop |
| Múltiplos erros em sequência rápida | Cooldown de 10s entre tentativas |
| Navegação para rota diferente após erro | Contador reseta, permite novas tentativas |

## Proteções

### Anti-Loop
- Máximo de 2 tentativas por path
- Cooldown de 10 segundos entre tentativas
- Estado persistido em `sessionStorage` (sobrevive ao reload)

### Segurança
- Validação contra Open Redirect antes do reload
- Bloqueia URLs absolutas, protocol-relative (`//`) e `javascript:`
- Valida encoding para evitar bypass

### Observabilidade
- Todos os erros são reportados ao Sentry
- Contexto inclui: tentativas, timestamps, user agent, URL
- Severidade `warning` se recuperável, `error` se não

## Uso

```js
// App.vue
import { useChunkPreloadErrorHandler } from '@/composables/useChunkPreloadErrorHandler'

useChunkPreloadErrorHandler()
```

## Configuração

```js
const MAX_RELOAD_ATTEMPTS = 2      // Tentativas máximas por path
const RELOAD_COOLDOWN_MS = 10_000  // Intervalo mínimo entre tentativas
```

## Referências

- [Handle version skew after new deployment with Vite and Vue Router](https://paulau.dev/blog/handle-version-skew-after-new-deployment-with-vite-and-vue-router/)
- [Nuxt chunk error handling](https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/composables/chunk.ts)
