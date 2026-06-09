# v6 Guidelines

Regras para implementar features destinadas a contas v6 — diferenciadas pelo client flag
`use_v6_configurations`, lido via `hasFlagUseV6Configurations()` em `src/composables/user-flag.js`.

> Este documento cresce conforme novos padrões surgirem. Adicione novas seções numeradas
> mantendo o tom prescritivo (regra → como aplicar → exemplo).

## Visão geral

- **Contas v6** usam o novo modelo de configuração; **contas legadas** continuam no modelo antigo.
- Toda feature nova de versionamento assume contas v6 como alvo padrão; o legado é tratado como
  caminho de fallback (fork) ou bloqueio total (gating), conforme o caso.
- A verificação da flag é **centralizada no arquivo de rotas**. Componentes/views carregados pelo
  router **não** devem importar `user-flag.js` para decidir variantes de UI.

---

## 1. Bifurcação por flag no router

**Regra:** quando uma feature precisar de dois fluxos (v6 vs. legado), a decisão é tomada no
arquivo de rotas — nunca dentro dos componentes/views.

### Quando aplicar

- Há divergência **estrutural** entre v6 e legado em uma página (ex.: Create, Edit).
- Existem rotas/abas **exclusivas do v6** sem equivalente legado.

### Como aplicar

1. Importe a flag no arquivo de rotas:

   ```js
   import { hasFlagUseV6Configurations } from '@/composables/user-flag'
   ```

2. **Rotas com fork** (v6 + legado coexistem) — use `import()` dinâmico no `component`:

   ```js
   {
     path: 'create',
     name: 'create-<feature>',
     component: () =>
       hasFlagUseV6Configurations()
         ? import('@views/<Feature>/CreateView.vue')
         : import('@views/<Feature>/legacy/CreateView.vue'),
     meta: { /* ... */ }
   }
   ```

3. **Rotas exclusivamente v6** (sem legado) — use `meta.flag`; o `flagGuard` já redireciona
   contas sem a flag para `/not-found`:

   ```js
   {
     path: 'edit/:id/deployment/:versionId',
     name: '<feature>-deployment-details',
     component: () => import('@views/<Feature>/DeploymentDetailsView.vue'),
     meta: {
       title: 'Deployment Details',
       flag: 'use_v6_configurations'
     }
   }
   ```

### Convenções de organização

- Views v6 ficam direto em `@views/<Feature>/`.
- Views legadas ficam em `@views/<Feature>/legacy/` (mesmo nome de arquivo).
- Blocos/drawers/composições **compartilhados** entre v6 e legado ficam fora de `legacy/` e são
  reutilizados pelos dois lados.
- Nenhuma view (v6 ou legado) deve importar `user-flag.js` — quando ela é carregada, o gate do
  router já decidiu por ela.

---

## 2. Services flag-aware (camada de dados)

Quando a divergência é **localizada na camada de dados** (formato do payload, estratégia de
certificado, etc.), o service v2 deve receber a flag como **parâmetro**, não importar o composable.

**Por quê:** a regra ESLint `services-http-only` proíbe import de composables em `src/services/v2/**`.

```js
// ❌ Errado: service v2 importando composable
import { hasFlagUseV6Configurations } from '@/composables/user-flag'

// ✅ Certo: a view passa a flag para o service
await createWorkload(payload, true)   // chamada feita pela view v6
await createWorkload(payload, false)  // chamada feita pela view legada
```

Adapters (ex.: `*-adapter.js`) **podem** ler o flag diretamente, pois não são services puros.

---

## Implementação de referência

`docs/WORKLOAD-VERSIONING.md` documenta o fork completo do Workload (rota, views, form, services,
validação) e é a referência canônica deste padrão. Consulte-o antes de iniciar um fork novo.

## Como verificar

- Alternar `use_v6_configurations` em `client_flags` (fixture `cypress/fixtures/account/info/*` ou
  conta de teste).
- **Com flag:** o router carrega o chunk v6; rotas v6-only ficam acessíveis.
- **Sem flag:** o router carrega o chunk legado; rotas v6-only redirecionam para `/not-found`.
- Confirmar (devtools / leitura) que nenhum componente carregado contém `if (flag)` para variantes
  de UI por versão — isso pertence ao router.
