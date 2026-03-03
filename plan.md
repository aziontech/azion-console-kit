# Plano: Migrar serviços para `core/` (renomear v2 + consolidar legacy)

## Resumo

Renomear `src/services/v2/` → `src/services/core/` e migrar todos os serviços legacy para dentro de `core/`, refatorando-os para o padrão class-based (BaseService). Remover duplicados legacy quando já existe versão v2. Manter diretórios v4 (endpoints diferentes). Não migrar testes.

## Escopo

| Métrica                                      | Valor          |
| -------------------------------------------- | -------------- |
| Diretórios legacy                            | 40             |
| Arquivos legacy (fora v2)                    | 313            |
| Módulos v2 existentes                        | 29             |
| Arquivos v2                                  | 118            |
| Imports de v2 para atualizar (excl. testes)  | 229 arquivos   |
| Imports legacy para atualizar (excl. testes) | 314 arquivos   |
| Testes                                       | **NÃO migrar** |

## Fases

### Fase 1 — Renomear `v2/` → `core/` (mecânico, baixo risco)

1. `git mv src/services/v2 src/services/core`
2. Buscar e substituir em todo o codebase (exceto testes):
   - `@/services/v2/` → `@/services/core/`
   - `../v2/` → `../core/` (imports relativos)
   - `services/v2/` → `services/core/` (strings em configs)
3. Atualizar referências em:
   - `.eslintrc.cjs` (regras de arquitetura)
   - `scripts/architecture-report/` (reporter)
   - `docs/ARCHITECTURE.md`
   - `CLAUDE.md` se mencionar v2
4. Verificar build: `npm run build`

**Entregável:** PR independente com apenas o rename v2 → core.

---

### Fase 2 — Remover serviços legacy duplicados (6 módulos)

Para cada módulo onde **já existe versão v2/core**, remover o legacy e atualizar imports:

| Legacy                      | Core (v2)                         | Ação                                 |
| --------------------------- | --------------------------------- | ------------------------------------ |
| `team-permission/`          | `core/team-permission/`           | Remover legacy, redirecionar imports |
| `billing-services/`         | `core/billing/` + `core/payment/` | Remover legacy, redirecionar imports |
| `network-lists-services/`   | `core/network-lists/`             | Remover legacy, redirecionar imports |
| `personal-tokens-services/` | `core/personal-token/`            | Remover legacy, redirecionar imports |
| `mfa-services/`             | `core/mfa/`                       | Remover legacy, redirecionar imports |
| `marketplace-services/`     | `core/marketplace/`               | Remover legacy, redirecionar imports |

Para cada módulo:

1. Verificar se a versão core cobre todas as funcionalidades do legacy
2. Se faltar algo, adicionar ao service core antes de remover
3. Atualizar todos os imports no codebase
4. Rodar build para validar

**Entregável:** PR com remoção dos 6 diretórios duplicados.

---

### Fase 3 — Migrar serviços legacy restantes para `core/` (principal)

Migrar os ~34 diretórios legacy restantes para `core/`, refatorando para padrão BaseService.

**Ordem por criticidade:**

**Batch 1 — Infraestrutura HTTP (manter como está):**

- `axios/` → `core/axios/` — mover sem refatorar (ainda é usado internamente via `base/http/`)

**Batch 2 — Serviços de autenticação e conta:**

- `auth-services/` → `core/auth/` (refatorar para class-based)
- `account-services/` → `core/account/` (merge com core/account existente)
- `account-settings-services/` → `core/account/` (merge)
- `accounts-management-services/` → `core/account/` (merge)
- `signup-services/` → `core/signup/`
- `switch-account-services/` → `core/account/`

**Batch 3 — Edge products:**

- `edge-application-services/` → `core/edge-app/` (merge, manter v4/)
- `edge-application-origins-services/` → `core/edge-app/`
- `edge-functions-services/` → `core/edge-function/` (merge, manter v4/)
- `edge-node-services/` → `core/edge-node/` (merge, manter v4/)
- `edge-node-service-services/` → `core/edge-service/` (merge)
- `edge-service-resources-services/` → `core/edge-service/` (merge)
- `domains-services/` → `core/domains/`
- `custom-pages-services/` → `core/custom-page/` (merge, manter v4/)
- `waf-rules-services/` → `core/waf/` (merge)
- `workloads-services/` → `core/workload/` (merge)
- `workload-deployment-service/` → `core/workload/` (merge)

**Batch 4 — Observabilidade e dados:**

- `real-time-events-service/` → `core/real-time-events/`
- `real-time-metrics-services/` → `core/real-time-metrics/`
- `real-time-purge/` → `core/purge/` (merge com core/purge existente)

**Batch 5 — Serviços menores:**

- `contract-services/` → `core/contract/`
- `identity-providers-services/` → `core/identity-providers/`
- `users-services/` → `core/users/` (merge)
- `feedback-services/` → `core/feedback/`
- `github-services/` → `core/github/`
- `help-center-services/` → `core/help-center/`
- `sidebar-menus-services/` → `core/sidebar-menus/`
- `status-page-services/` → `core/status-page/`
- `template-engine-services/` → `core/template-engine/`
- `vulcan-services/` → `core/vulcan/`
- `script-runner-service/` → `core/script-runner/`
- `compare-with-azion/` → `core/compare-with-azion/`
- `utils/` → `core/utils/` (merge com core/utils existente)

**Para cada módulo no batch:**

1. Criar service class estendendo BaseService
2. Criar adapter (snake_case → camelCase)
3. Criar types/contracts se necessário
4. Mover para `core/<nome>/`
5. Atualizar imports em todo o codebase
6. Deletar diretório legacy
7. Verificar build

**Entregável:** 1 PR por batch (5 PRs).

---

### Fase 4 — Limpeza final

1. Atualizar `docs/ARCHITECTURE.md` com a nova estrutura
2. Atualizar regras do ESLint plugin para a nova estrutura
3. Atualizar scripts de architecture-report
4. Build + smoke test final

---

## Regras

- **Não migrar testes** — continuam apontando para os paths antigos ou novos conforme necessário
- **Manter v4/** — diretórios v4 dentro de serviços legacy são preservados (servem endpoints diferentes)
- **Cada fase = 1+ PRs independentes** — mergeáveis separadamente
- **Build deve passar** ao final de cada fase
- **Imports de testes** podem quebrar — serão corrigidos em task separada se necessário

## Estimativa de Complexidade

| Fase                        | Complexidade | Escopo                                    |
| --------------------------- | ------------ | ----------------------------------------- |
| Fase 1 (rename v2→core)     | Baixa        | ~229 arquivos, find/replace mecânico      |
| Fase 2 (remover duplicados) | Média        | 6 módulos, validação de cobertura         |
| Fase 3 (migrar legacy)      | Alta         | ~34 módulos, refatoração para BaseService |
| Fase 4 (limpeza)            | Baixa        | Docs, configs, validação                  |
