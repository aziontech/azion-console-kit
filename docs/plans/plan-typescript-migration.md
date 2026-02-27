
# Plano de Migração para TypeScript (PT-BR)

---

## Fase 1: Configuração Base ✅
**Status:** Concluída

- [tsconfig.json](cci:7://file:///Users/robson.junior/dev/azion-console-kit/tsconfig.json:0:0-0:0) criado
- [src/vite-env.d.ts](cci:7://file:///Users/robson.junior/dev/azion-console-kit/src/vite-env.d.ts:0:0-0:0) criado
- [.eslintrc.cjs](cci:7://file:///Users/robson.junior/dev/azion-console-kit/.eslintrc.cjs:0:0-0:0) atualizado
- Scripts adicionados ao [package.json](cci:7://file:///Users/robson.junior/dev/azion-console-kit/package.json:0:0-0:0)
- **Pendente:** Instalar dependências (`yarn add -D typescript vue-tsc @vue/tsconfig @typescript-eslint/parser @typescript-eslint/eslint-plugin`)

---

## Fase 2: Helpers e Utils
**Prioridade:** Alta | **Complexidade:** Baixa

- Renomear `.js` → `.ts`
- Adicionar tipos aos parâmetros e retornos
- Criar interfaces para objetos complexos
- **Pasta:** [src/helpers/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/helpers:0:0-0:0), [src/utils/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/utils:0:0-0:0)

```typescript
// Exemplo: theme-apply.ts
type Theme = 'light' | 'dark' | 'system'
export const themeApply = (theme: Theme): void => { ... }
```

---

## Fase 3: Services
**Prioridade:** Alta | **Complexidade:** Média

- Tipar responses de APIs
- Criar interfaces para payloads e responses
- Usar generics para serviços reutilizáveis
- **Pasta:** [src/services/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/services:0:0-0:0)

```typescript
// Exemplo
interface EdgeApplicationResponse {
  id: number
  name: string
  // ...
}
```

---

## Fase 4: Stores (Pinia)
**Prioridade:** Média | **Complexidade:** Média

- Tipar state, getters e actions
- Usar `defineStore` com generics
- **Pasta:** [src/stores/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/stores:0:0-0:0)

```typescript
interface AccountState {
  user: User | null
  isAuthenticated: boolean
}
```

---

## Fase 5: Composables
**Prioridade:** Média | **Complexidade:** Média

- Tipar parâmetros e retornos dos hooks
- Usar generics quando aplicável
- **Pasta:** [src/composables/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/composables:0:0-0:0)

```typescript
export function useLayout(): {
  sidebarVisible: Ref<boolean>
  toggleSidebar: () => void
}
```

---

## Fase 6: Componentes Vue
**Prioridade:** Baixa | **Complexidade:** Alta

### 6.1 Componentes Internos (simples)
- Adicionar `<script setup lang="ts">`
- Usar `defineProps<T>()` e `defineEmits<T>()`

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}
const props = defineProps<Props>()
</script>
```

### 6.2 Componentes Reutilizáveis (ClassComponent)
**Para componentes compartilhados/biblioteca**, usar abordagem granular:

```
src/components/
├── my-component/
│   ├── index.vue
│   ├── MyComponent.d.ts      # Tipos exportados
│   └── ts-helpers.d.ts       # ClassComponent base
```

**Estrutura do `.d.ts`:**
```typescript
import { ClassComponent, GlobalComponentConstructor } from '../ts-helpers'

export interface MyComponentProps {
  label: string
  disabled?: boolean
}

export interface MyComponentSlots {
  default(): VNode[]
  icon(): VNode[]
}

export interface MyComponentEmits {
  click: [event: MouseEvent]
  change: [value: string]
}

declare class MyComponent extends ClassComponent<
  MyComponentProps,
  MyComponentSlots,
  MyComponentEmits
> {}

export default MyComponent
```

---

## Resumo da Estratégia

| Fase | Pasta | Abordagem | Esforço |
|------|-------|-----------|---------|
| 2 | [helpers/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/helpers:0:0-0:0), [utils/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/utils:0:0-0:0) | Tipos inline | Baixo |
| 3 | [services/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/services:0:0-0:0) | Interfaces de API | Médio |
| 4 | [stores/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/stores:0:0-0:0) | State tipado | Médio |
| 5 | [composables/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/composables:0:0-0:0) | Retornos tipados | Médio |
| 6.1 | [views/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/views:0:0-0:0), [components/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/components:0:0-0:0) (internos) | `defineProps<T>` | Médio |
| 6.2 | [components/](cci:9://file:///Users/robson.junior/dev/azion-console-kit/src/components:0:0-0:0) (reutilizáveis) | `ClassComponent` + `.d.ts` | Alto |

---

## Dica de Migração Gradual

Comece com `strict: false` (já configurado) e migre arquivo por arquivo. Quando a maioria estiver tipada, ative `strict: true` para validação completa.