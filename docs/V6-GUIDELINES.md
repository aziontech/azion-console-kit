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

2. **Rotas com fork** (v6 + legado coexistem) — use `import()` dinâmico no `component`. O
   arquivo v6 mora em `<Feature>/v6/`; o legado permanece intacto onde já está:

   ```js
   {
     path: 'create',
     name: 'create-<feature>',
     component: () =>
       hasFlagUseV6Configurations()
         ? import('@views/<Feature>/v6/CreateView.vue')
         : import('@views/<Feature>/CreateView.vue'),
     meta: { /* ... */ }
   }
   ```

3. **Rotas exclusivamente v6** (sem legado) — use `meta.flag`; o `flagGuard` já redireciona
   contas sem a flag para `/not-found`. Arquivo v6-only também vive em `<Feature>/v6/`:

   ```js
   {
     path: 'edit/:id/deployment/:versionId',
     name: '<feature>-deployment-details',
     component: () => import('@views/<Feature>/v6/DeploymentDetailsView.vue'),
     meta: {
       title: 'Deployment Details',
       flag: 'use_v6_configurations'
     }
   }
   ```

### Convenções de organização

- **Arquivos v6 novos vão em `@views/<Feature>/v6/`** (mesmo nome de arquivo que o legado
  equivalente, quando houver).
- **Código legado fica intacto onde está hoje.** Não mover. Imports relativos existentes
  (`./Tabs/...`, `./FormFields/...`) continuam válidos.
- Blocos/drawers/composições **compartilhados** entre v6 e legado ficam fora de `v6/` e são
  reutilizados pelos dois lados — tipicamente em `@views/<Feature>/FormFields/`,
  `@views/<Feature>/Drawer/`, etc.
- Nenhuma view (v6 ou legada) deve importar `user-flag.js` — quando ela é carregada, o gate do
  router já decidiu por ela.

**Por que esse layout (e não `legacy/` no root):** mover o legado pra subpasta `legacy/` exige
ajustar todos os imports relativos dentro dos arquivos movidos e todos os consumidores externos
que importam dali. Em features com legado consolidado (subpastas internas, FormFields
compartilhados, sub-tabs com ListViews próprios), isso vira blast radius alto sem ganho
funcional. Criar o v6 em subpasta isola o código novo sem tocar no que já funciona.

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

`docs/WORKLOAD-VERSIONING.md` documenta o fork completo do Workload e é referência **conceitual**
do padrão (fork por flag no router, services flag-aware, formas de divergir UI por estado de
versão). No entanto, o **layout de arquivos** do Workload precede esta guideline: ele usa
`legacy/` no root (variante antiga) em vez de `v6/` em subpasta. **Workload será migrado
futuramente para o padrão atual** — até lá, a guideline canônica de layout é a desta seção, não a
do Workload.

## Como verificar

- Alternar `use_v6_configurations` em `client_flags` (fixture `cypress/fixtures/account/info/*` ou
  conta de teste).
- **Com flag:** o router carrega o chunk v6; rotas v6-only ficam acessíveis.
- **Sem flag:** o router carrega o chunk legado; rotas v6-only redirecionam para `/not-found`.
- Confirmar (devtools / leitura) que nenhum componente carregado contém `if (flag)` para variantes
  de UI por versão — isso pertence ao router.
