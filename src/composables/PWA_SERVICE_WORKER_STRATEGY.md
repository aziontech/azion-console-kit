# PWA com Service Worker para Version Skew

## O que é

Um **Service Worker** é um script que roda em background no navegador, interceptando requisições de rede. Em uma **PWA (Progressive Web App)**, ele cacheia os assets da aplicação localmente no dispositivo do usuário.

## Como resolve o Version Skew

```
SEM Service Worker:
┌─────────┐     GET /chunk-abc123.js     ┌─────────┐
│ Browser │ ──────────────────────────▶  │ Server  │
│         │ ◀────────────────────────────│         │
└─────────┘        404 Not Found         └─────────┘
                   (chunk deletado)

COM Service Worker:
┌─────────┐     GET /chunk-abc123.js     ┌─────────────────┐
│ Browser │ ──────────────────────────▶  │ Service Worker  │
│         │ ◀────────────────────────────│ (cache local)   │
└─────────┘        200 OK                └─────────────────┘
                   (chunk cacheado)
```

O Service Worker:
1. Pré-cacheia todos os chunks no primeiro acesso
2. Serve os assets do cache local (offline-first ou cache-first)
3. Atualiza o cache em background quando há nova versão
4. Notifica o usuário sobre atualização disponível

## Ganhos

| Benefício | Descrição |
|-----------|-----------|
| **Elimina 404 de chunks** | Assets sempre disponíveis no cache local |
| **Performance** | Carregamento instantâneo (sem rede) |
| **Offline** | App funciona sem internet |
| **Controle de update** | Usuário decide quando atualizar |
| **Menor uso de banda** | Assets baixados uma vez |
| **UX consistente** | Sem reloads inesperados |

## Perdas

| Desvantagem | Descrição |
|-------------|-----------|
| **Complexidade** | Lógica de cache, invalidação, ciclo de vida |
| **Debugging difícil** | Cache pode mascarar problemas |
| **Usuários em versão antiga** | Podem ficar "presos" se não aceitarem update |
| **Tamanho inicial** | Primeiro load baixa todos os chunks |
| **HTTPS obrigatório** | Service Workers só funcionam em HTTPS |
| **iOS limitações** | Safari tem restrições (storage, background sync) |
| **Cache invalidation** | "One of the two hard things in CS" |

## Estratégias de Cache

### 1. Cache-First (Recomendado para assets)
```
Request → Cache hit? → Sim → Retorna cache
                ↓ Não
          Fetch network → Cacheia → Retorna
```

### 2. Network-First (Recomendado para API)
```
Request → Fetch network → Sucesso → Cacheia → Retorna
                ↓ Falha
          Cache hit? → Retorna cache
```

### 3. Stale-While-Revalidate
```
Request → Retorna cache imediatamente
        → Fetch network em background
        → Atualiza cache para próxima vez
```

## Implementação com vite-plugin-pwa

### Instalação
```bash
yarn add -D vite-plugin-pwa
```

### Configuração básica (vite.config.js)
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt', // ou 'autoUpdate'
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }
            }
          }
        ]
      },
      manifest: {
        name: 'Azion Console',
        short_name: 'Azion',
        theme_color: '#171717'
      }
    })
  ]
})
```

### Componente de Update (Vue)
```vue
<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()

function onUpdate() {
  updateServiceWorker(true)
}
</script>

<template>
  <Dialog v-if="needRefresh" @confirm="onUpdate">
    Nova versão disponível. Atualizar?
  </Dialog>
</template>
```

## Comparação: Service Worker vs Reload Strategy

| Aspecto | Service Worker | Reload (atual) |
|---------|----------------|----------------|
| Complexidade | Alta | Baixa |
| Tempo de implementação | Dias/Semanas | Horas |
| Manutenção | Contínua | Mínima |
| UX | Melhor (sem reload) | Aceitável (reload transparente) |
| Offline | Sim | Não |
| Resolve version skew | 100% | ~95% (edge cases) |

## Recomendação

Para o Azion Console:

**Manter a estratégia atual de reload** porque:
1. Menor complexidade operacional
2. Console requer conexão (APIs em tempo real)
3. Dados sensíveis não devem ser cacheados
4. Reload strategy já cobre 95%+ dos casos

**Considerar PWA se:**
1. Usuários reportarem problemas frequentes de version skew
2. Houver demanda por modo offline
3. Performance de carregamento for crítica

## Referências

- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Workbox (Google)](https://developer.chrome.com/docs/workbox)
- [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Builder](https://www.pwabuilder.com/)
