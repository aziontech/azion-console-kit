# Configuração de Contas QA para Testes E2E

## Visão Geral

O framework de testes Cypress requer **4 tipos de contas** por ambiente (stage/prod) para cobrir todas as combinações de profiles de usuário.

## Profiles de Teste

O console-kit opera em 2 dimensões que afetam a interface:

### 1. UI Version (Interface)
- **V4 UI (Moderna)**: Sem a flag `block_apiv4_incompatible_endpoints`
- **V3 UI (Legacy)**: Com a flag `block_apiv4_incompatible_endpoints`

### 2. Account Configuration (Domínios)
- **V5 Config (Massivo)**: `useV5Configurations: true` - para contas com milhares de domínios
- **V3 Config (Standard)**: `useV5Configurations: false` - para contas com poucos domínios

## Matriz de 4 Contas

| Profile ID | UI | Config | Flags Necessárias | Secret Prefix |
|------------|-----|--------|-------------------|---------------|
| `V4_UI_V5_CONFIG` | v4 (moderna) | v5 (massivo) | `allow_console`, `useV5Configurations: true` | `_V4V5` |
| `V4_UI_V3_CONFIG` | v4 (moderna) | v3 (standard) | `allow_console`, `useV5Configurations: false` | `_V4V3` |
| `V3_UI_V5_CONFIG` | v3 (legacy) | v5 (massivo) | `allow_console`, `block_apiv4_incompatible_endpoints`, `useV5Configurations: true` | `_V3V5` |
| `V3_UI_V3_CONFIG` | v3 (legacy) | v3 (standard) | `allow_console`, `block_apiv4_incompatible_endpoints`, `useV5Configurations: false` | `_V3V3` |

## GitHub Secrets Necessários

### Por Ambiente (Stage/Prod)

```
# Conta Default (V4 UI + V5 Config) - mais comum
STAGE_CYPRESS_EMAIL
STAGE_CYPRESS_PASSWORD
STAGE_CYPRESS_TOKEN

# Conta V4 UI + V3 Config
STAGE_CYPRESS_EMAIL_V4V3
STAGE_CYPRESS_PASSWORD_V4V3
STAGE_CYPRESS_TOKEN_V4V3

# Conta V3 UI + V5 Config
STAGE_CYPRESS_EMAIL_V3V5
STAGE_CYPRESS_PASSWORD_V3V5
STAGE_CYPRESS_TOKEN_V3V5

# Conta V3 UI + V3 Config
STAGE_CYPRESS_EMAIL_V3V3
STAGE_CYPRESS_PASSWORD_V3V3
STAGE_CYPRESS_TOKEN_V3V3
```

Repetir para `PROD_*`.

## Uso nos Workflows

### Workflow com Matrix de Profiles

```yaml
jobs:
  e2e-tests:
    strategy:
      matrix:
        profile: [V4_UI_V5_CONFIG, V4_UI_V3_CONFIG, V3_UI_V5_CONFIG, V3_UI_V3_CONFIG]
    steps:
      - name: Run Cypress Tests
        env:
          CYPRESS_EMAIL: ${{ matrix.profile == 'V4_UI_V5_CONFIG' && secrets.STAGE_CYPRESS_EMAIL ||
                            matrix.profile == 'V4_UI_V3_CONFIG' && secrets.STAGE_CYPRESS_EMAIL_V4V3 ||
                            matrix.profile == 'V3_UI_V5_CONFIG' && secrets.STAGE_CYPRESS_EMAIL_V3V5 ||
                            secrets.STAGE_CYPRESS_EMAIL_V3V3 }}
          TEST_PROFILE: ${{ matrix.profile }}
```

### Tags de Teste por Profile

```javascript
// Teste que só roda em V3 UI
describe('Legacy Feature', { tags: ['@v3-ui'] }, () => { ... })

// Teste que só roda em V5 Config
describe('Massive Domains', { tags: ['@v5-config'] }, () => { ... })

// Teste que roda em todos os profiles
describe('Common Feature', { tags: ['@all-profiles'] }, () => { ... })
```

## Configuração das Contas no Admin

Para configurar uma conta com os flags corretos:

1. Acessar o admin da Azion
2. Localizar a conta de QA
3. Editar `client_flags[]`:
   - V4 UI: Remover `block_apiv4_incompatible_endpoints`
   - V3 UI: Adicionar `block_apiv4_incompatible_endpoints`
4. Editar configuração de domínios:
   - V5 Config: Habilitar `useV5Configurations`
   - V3 Config: Desabilitar `useV5Configurations`

## Referências

- Branch QA: `origin/qa/lucas` em `azion-cypress-test`
- Account Info Data: `cypress/e2e/edge-application/rules-engine/account-info-data.js`
- Cleanup Script: `scripts/cleanup.js` (usa padrão `${ENV}_*TOKEN$`)
