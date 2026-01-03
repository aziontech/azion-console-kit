# Guia de Testes Cypress

## Filosofia de Testes

### CRUD Primeiro, Depois Expandir

A abordagem para cobertura de testes segue uma progressao:

1. **CRUD Basico** - Todo modulo deve ter `create`, `read-list`, `update`, `delete`
2. **Variacoes** - Tipos especificos (ex: Network List IP/CIDR vs Countries)
3. **Integracoes** - Testes que dependem de outros modulos
4. **Edge Cases** - Corner cases, validacoes, estados de erro

### Profiles

Testes devem considerar as 4 combinacoes de profile:

| Profile | UI | Config | Descricao |
|---------|-----|--------|-----------|
| V4_UI_V5_CONFIG | v4 | v5 | Padrao (novos recursos) |
| V4_UI_V3_CONFIG | v4 | v3 | Apps legados migrados |
| V3_UI_V5_CONFIG | v3 | v5 | UI legada com config nova |
| V3_UI_V3_CONFIG | v3 | v3 | Legacy total |

---

## Estrutura de Pastas

```
cypress/specs/{module}/
├── crud/              # CRUD basico (OBRIGATORIO)
│   ├── create.cy.js
│   ├── read-list.cy.js
│   ├── update.cy.js
│   └── delete.cy.js
├── functional/        # Testes isolados com fixtures (replay)
├── integration/       # Testes que dependem de outros modulos
└── cache/             # Testes de invalidacao de cache
```

### Convencao de Nomenclatura

- Arquivos: `kebab-case.cy.js`
- Describes: `Module - Operation`
- Its: `should <acao esperada>`

---

## Como Descobrir Gaps

**Nao liste gaps estaticamente** - eles ficam desatualizados. Use esta metodologia:

### 1. Verificar Modulos com CRUD

```bash
# Listar modulos com testes CRUD
find cypress/specs -type d -name "crud" -exec ls {} \;

# Comparar com views do produto
ls src/views/
```

### 2. Verificar Sub-recursos

Cada modulo pode ter sub-recursos nao testados:

| Modulo | Sub-recursos a verificar |
|--------|--------------------------|
| edge-applications | Origins, Cache, Rules Engine, Functions |
| edge-firewall | Rules Engine, Functions |
| edge-dns | Records (12 tipos) |
| waf | Allowed Rules |
| data-stream | Connectors (10 tipos) |

### 3. Analisar Legados para Intents

```bash
# Ver o que os testes legados tentavam testar
ls cypress/e2e/

# Extrair intents (o que testar, nao como)
# Os legados sao referencia de INTENTS, nao de implementacao
```

### 4. Comparar com Codigo Fonte

```bash
# Views disponiveis
ls src/views/

# Services de API
ls src/services/
```

---

## Criando Testes de Integracao (Sub-recursos)

Para criar testes de **sub-recursos** (como Rules Engine, Function Instances, Cache Settings), siga esta metodologia baseada em analise de codigo fonte.

### Passo 1: Identificar o Modulo e Sub-recursos

```bash
# Listar Views do modulo
ls src/views/{ModuleName}*/

# Exemplo para Edge Firewall:
# src/views/EdgeFirewall/           # Main Settings
# src/views/EdgeFirewallFunctions/  # Functions Instances (sub-recurso)
# src/views/EdgeFirewallRulesEngine/ # Rules Engine (sub-recurso)
```

### Passo 2: Analisar Services (APIs)

```bash
# Localizar services
ls src/services/v2/{module}/

# Verificar versao da API
grep -r "v4/workspace" src/services/{module}/
```

Estrutura tipica de service:
```javascript
export class {Resource}Service extends BaseService {
  constructor() {
    this.baseURL = 'v4/workspace/{resource}'
  }
  list{Resource}Service()   // GET list
  create{Resource}Service() // POST create
  load{Resource}Service()   // GET single
  edit{Resource}Service()   // PATCH/PUT update
  delete{Resource}Service() // DELETE
}
```

### Passo 3: Verificar Selectors Existentes

```bash
# Verificar selectors do modulo
cat cypress/support/selectors/product-selectors/{module}.js

# Procurar data-testids nas Views
grep -r "data-testid" src/views/{ModuleName}/ --include="*.vue"
```

### Passo 4: Analisar Formulario (Form Fields)

Importante entender o fluxo do formulario:

```bash
# Ver campos do formulario
cat src/views/{Module}/FormFields/*.vue
```

**Atencao especial para:**
- Campos que dependem de outros (ex: criteria variable -> operator -> argument)
- Campos condicionais (ex: behaviors que requerem modulos habilitados)
- Dropdowns com lazy loading

### Passo 5: Criar Arquivo de Teste

```javascript
/**
 * {Module} - {SubResource} Integration Tests
 *
 * API: POST/GET/PATCH/DELETE v4/workspace/{resource}
 * Route: /{module}/edit/{id}/{sub-resource}
 *
 * Prerequisites: {Listar pre-requisitos}
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/{module}'

describe('{Module} - {SubResource}', { tags: ['@integration', '@{module}'] }, () => {
  let parentResourceName
  let parentResourceId

  before(() => {
    // Criar recurso pai se necessario
  })

  beforeEach(() => {
    cy.login()
    // Navegar ate o recurso
    cy.openProduct('{Module}')
    // Aguardar lista carregar
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 60000 }).should('exist')
    // Aguardar skeletons
    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 60000 }).should('not.exist')
      }
    })
  })

  // Testes...
})
```

### Problemas Comuns e Solucoes

| Problema | Solucao |
|----------|---------|
| Skeleton timeout | Aumentar timeout para 60000ms |
| Elemento nao visivel | Usar `scrollIntoView()` |
| Multiplos elementos | Usar `.first()` |
| Campo desabilitado | Verificar se campo depende de outro (ex: selecionar variable antes de argument) |
| URL com padrao diferente | Usar regex: `cy.url().should('match', /pattern1\|pattern2/)` |
| Toast animando | Usar `.should('exist')` ao inves de `.should('be.visible')` |
| Nome invalido | Usar hifen ao inves de underscore em nomes |
| Drawer nao fecha | Esperar API completar com `cy.wait('@alias')` |
| Busca nao atualiza | Limpar busca e pesquisar novamente apos edicao |

### Padroes de URL (APIv4)

As URLs mudaram na APIv4. Usar regex para compatibilidade:

```javascript
// URLs de edicao
cy.url().should('match', /\/(edge-firewall|firewall|firewalls)\/edit\/\d+/)

// Sub-recursos (podem ser camelCase ou kebab-case)
cy.url().should('match', /rules-engine|rulesEngine/)
cy.url().should('match', /functions|functionsInstances/)
```

### Fluxo de Formularios Complexos

Para formularios com campos dependentes (ex: Firewall Rules Engine):

```javascript
// Helper para preencher criteria corretamente
const fillCriteriaWithRequestUri = (value) => {
  // 1. Primeiro selecionar a variavel
  cy.get(selectors.ruleCriteriaVariableDropdown).click()
  cy.get(selectors.ruleCriteriaVariableDropdownRequestUri).click()

  // 2. Depois selecionar o operador
  cy.get(selectors.ruleCriteriaOperatorDropdown).click()
  cy.get(selectors.ruleCriteriaOperatorFirstOption).click()

  // 3. Agora o argumento estara habilitado
  cy.get(selectors.ruleCriteriaInput)
    .should('not.be.disabled')
    .clear()
    .type(value)
}
```

### Exemplo Pratico: Firewall Rules Engine

Arquivo: `cypress/specs/edge-firewall/integration/rules-engine.cy.js`

Analise realizada:
1. **View**: `src/views/EdgeFirewallRulesEngine/`
2. **Service**: `src/services/v2/edge-firewall/edge-firewall-rules-engine-service.js`
3. **API**: `v4/workspace/firewalls/{id}/request_rules`
4. **Selectors**: `cypress/support/selectors/product-selectors/edge-firewall.js`

Behaviors disponiveis:
- Deny (403 Forbidden) - sempre disponivel
- Drop (Close Without Response) - sempre disponivel
- Set Rate Limit - sempre disponivel
- Set WAF - requer modulo WAF habilitado
- Run Function - requer modulo Edge Functions habilitado
- Tag Event - sempre disponivel

Variables de criteria:
- Request URI, Host, Request Args - sempre disponiveis
- Headers (Accept, Cookie, etc) - requerem modulo WAF habilitado

Resultado: **10 testes, 9 passando** apos ajustes de URL patterns e fluxo de formulario.

---

## Modos de Teste

| Modo | Env Var | Descricao |
|------|---------|-----------|
| LIVE | `TEST_MODE=live` | Executa contra API real (padrao no CI) |
| RECORD | `TEST_MODE=record` | Grava fixtures da API |
| REPLAY | `TEST_MODE=replay` | Usa fixtures gravadas (isolado) |

```bash
# Executar em modo live (padrao)
npx cypress run --spec "cypress/specs/variables/crud/create.cy.js"

# Gravar fixtures
CYPRESS_TEST_MODE=record npx cypress run --spec "..."

# Usar fixtures (replay)
CYPRESS_TEST_MODE=replay npx cypress run --spec "..."
```

---

## Helpers Disponiveis

Importar de `cypress/support/console-kit-helpers`:

```javascript
import {
  tableHelpers,
  formHelpers,
  apiHelpers,
  cacheHelpers,
  profileHelpers
} from '../../support/console-kit-helpers'
```

### tableHelpers

```javascript
// Aguardar lista carregar (com ou sem dados)
tableHelpers.waitForListReady()

// Buscar na tabela
tableHelpers.search('termo')

// Clicar em linha
tableHelpers.clickRow(0)

// Abrir menu de acoes
tableHelpers.openRowActionsMenu(0)
tableHelpers.clickRowAction('Delete')

// Verificar estado vazio
tableHelpers.assertEmpty()
```

### formHelpers

```javascript
// Preencher campo
formHelpers.fillField('input-testid', 'valor')

// Submeter formulario
formHelpers.submitForm()

// Verificar toast de sucesso
cy.verifyToast('success', 'mensagem')
```

### profileHelpers

```javascript
// Verificar profile atual
profileHelpers.isV4UI()
profileHelpers.isV5Config()

// Setup de profile
profileHelpers.setupProfile()

// Obter endpoint correto
profileHelpers.getApiEndpoint('edgeFunctions', true) // v4
```

---

## Template de Teste CRUD

```javascript
/**
 * Module - CRUD Tests
 *
 * API: POST/GET/PUT/DELETE v4/module
 * Route: /module/create, /module, /module/edit/:id
 */

import selectors from '../../support/selectors'
import { tableHelpers } from '../../support/console-kit-helpers'

const generateUniqueName = (prefix = 'TEST') => {
  return `${prefix}_${Date.now()}`
}

describe('Module - CRUD', { tags: ['@crud', '@module', '@smoke'] }, () => {
  beforeEach(() => {
    cy.login()
    cy.openProduct('Module Name')
    tableHelpers.waitForListReady()
  })

  describe('Create', () => {
    it('should create a basic item', () => {
      const name = generateUniqueName('ITEM')

      // Intercept
      cy.intercept('POST', '**/v4/module').as('createItem')

      // Navigate to create
      cy.get('[data-testid="create_Module_button"]').click()

      // Fill form
      cy.get('[data-testid="module-form__name-field__input"]')
        .clear()
        .type(name)

      // Submit
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Assert
      cy.wait('@createItem').its('response.statusCode').should('eq', 201)
      cy.url().should('not.include', '/create')
    })

    it('should show validation error for empty name', () => {
      cy.get('[data-testid="create_Module_button"]').click()
      cy.get('[data-testid="form-actions-submit-button"]').click()
      cy.get('[data-testid="module-form__name-field__error-message"]')
        .should('be.visible')
    })
  })

  describe('Read List', () => {
    it('should display table with items', () => {
      cy.get('.p-datatable').should('exist')
      cy.get('[data-testid="list-table-block__column__name__row"]')
        .should('have.length.at.least', 1)
    })

    it('should filter by search term', () => {
      tableHelpers.search('termo')
      // Assert filtered results
    })
  })

  describe('Update', () => {
    it('should update item', () => {
      // Click first row
      tableHelpers.clickRow(0)

      // Edit field
      cy.get('[data-testid="module-form__name-field__input"]')
        .clear()
        .type('Updated Name')

      // Submit
      cy.get('[data-testid="form-actions-submit-button"]').click()

      // Assert
      cy.verifyToast('success', 'updated')
    })
  })

  describe('Delete', () => {
    it('should delete item', () => {
      tableHelpers.openRowActionsMenu(0)
      tableHelpers.clickRowAction('Delete')

      // Confirm dialog
      cy.get('[data-testid="dialog-confirm-button"]').click()

      // Assert
      cy.verifyToast('success', 'deleted')
    })
  })
})
```

---

## Selectors

Usar `data-testid` sempre que possivel. Centralizar em `cypress/support/selectors.js`.

### Padroes de Nomenclatura

```
{modulo}-{componente}__{elemento}__{modificador}
```

Exemplos:
- `variables-form__key-field__input`
- `variables-form__key-field__error-message`
- `form-actions-submit-button`
- `data-table-search-input`
- `list-table-block__column__name__row`

### Fallbacks

Quando `data-testid` nao existe:

```javascript
// Ordem de preferencia
cy.get('[data-testid="..."]')           // 1. data-testid
cy.get('[aria-label="..."]')            // 2. aria-label
cy.get('.p-component-class')            // 3. PrimeVue classes
cy.contains('button', 'Text')           // 4. Texto visivel
```

---

## Checklist para Novo Teste

- [ ] Modulo tem CRUD em `specs/{module}/crud/`?
- [ ] Usa helpers existentes (nao reinventa)?
- [ ] Selectors centralizados em `support/selectors.js`?
- [ ] Tags apropriadas (@crud, @smoke, @functional)?
- [ ] Intercepts para chamadas de API?
- [ ] Timeouts adequados (nao hardcoded)?
- [ ] Funciona em modo LIVE?

---

## Comandos de Execucao

```bash
# Teste especifico
npx cypress run --spec "cypress/specs/module/crud/create.cy.js"

# Com profile especifico
CYPRESS_TEST_PROFILE=V4_UI_V3_CONFIG npx cypress run

# Por tag
npx cypress run --env grepTags=@smoke

# Abrir interface grafica
npx cypress open

# Com sharding (CI)
SPLIT=4 SPLIT_INDEX=0 npx cypress run
```

---

## Workflows do GitHub

| Workflow | Trigger | Tags |
|----------|---------|------|
| cypress-tests-smoke.yml | PR, push | @smoke |
| cypress-tests-sharded.yml | Manual, schedule | Todos |
| cypress-tests-profiles.yml | Manual | @profiles |

---

## Erros Comuns

### 1. Timeout em waitForListReady

```javascript
// Errado: timeout muito curto
tableHelpers.waitForListReady(5000)

// Certo: usar timeout adequado
tableHelpers.waitForListReady(30000)
```

### 2. Nao aguardar API

```javascript
// Errado: nao aguarda resposta
cy.get('[data-testid="submit"]').click()
cy.url().should('not.include', '/create')

// Certo: aguarda API
cy.intercept('POST', '**/api/resource').as('create')
cy.get('[data-testid="submit"]').click()
cy.wait('@create')
cy.url().should('not.include', '/create')
```

### 3. Selectors frageis

```javascript
// Errado: depende de estrutura DOM
cy.get('.container > div:nth-child(2) > button')

// Certo: usa data-testid
cy.get('[data-testid="action-button"]')
```

---

## Rules Engine Helpers

O Rules Engine e um sub-recurso critico presente em Edge Application e Edge Firewall. Muitos testes de integracao dependem de criar regras.

### Importar

```javascript
import { rulesEngineHelpers } from '../../support/console-kit-helpers'
```

### Funcoes Disponiveis

#### Criar Regra Basica

```javascript
// Criar regra com behavior padrao (Deliver)
const ruleName = rulesEngineHelpers.createRule({
  name: 'MyRule',           // opcional - auto-gerado se nao fornecido
  criteriaValue: '/api/*',  // valor do criteria
  phase: 'Request Phase'    // ou 'Response Phase'
})
```

#### Criar Regra com Behavior Especifico

```javascript
// Regra com Deny
rulesEngineHelpers.createRuleWithBehavior({
  name: 'BlockRule',
  behavior: 'Deny (403 Forbidden)',
  criteriaValue: '/blocked/*'
})

// Regra com Set Cache Policy
rulesEngineHelpers.createRuleWithCachePolicy({
  name: 'CacheRule',
  cachePolicyName: 'Default Cache Settings',
  criteriaValue: '/static/*'
})

// Regra com Run Function
rulesEngineHelpers.createRuleWithFunction({
  name: 'FunctionRule',
  functionInstanceName: 'MyFunction',
  criteriaValue: '/compute/*'
})
```

#### Gerenciar Regras

```javascript
// Editar regra existente
rulesEngineHelpers.editRule('OldName', {
  name: 'NewName',
  criteriaValue: '/new-path/*'
})

// Deletar regra
rulesEngineHelpers.deleteRule('RuleName')
```

#### Pre-requisitos

```javascript
// Criar Edge Application (necessario antes de criar regras)
const appName = rulesEngineHelpers.createEdgeApplication('MyTestApp')

// Limpar no final do teste
rulesEngineHelpers.deleteEdgeApplication(appName)
```

### Exemplo Completo

```javascript
import { rulesEngineHelpers } from '../../support/console-kit-helpers'

describe('Feature that needs Rules Engine', () => {
  let appName

  before(() => {
    cy.login()
    appName = rulesEngineHelpers.createEdgeApplication()
  })

  it('should do something with a cache rule', () => {
    const ruleName = rulesEngineHelpers.createRuleWithCachePolicy({
      cachePolicyName: 'Default Cache Settings',
      criteriaValue: '/cache/*'
    })

    // ... resto do teste
  })

  after(() => {
    rulesEngineHelpers.deleteEdgeApplication(appName)
  })
})
```

### Behaviors Disponiveis

| Behavior | Metodo Helper | Configuracao |
|----------|---------------|--------------|
| Deliver | `createRule()` | Padrao |
| Deny (403 Forbidden) | `createRuleWithBehavior()` | `behavior: 'Deny (403 Forbidden)'` |
| Set Cache Policy | `createRuleWithCachePolicy()` | `cachePolicyName` |
| Run Function | `createRuleWithFunction()` | `functionInstanceName` |
| Redirect to (301) | `createRuleWithBehavior()` | `behavior: 'Redirect To (301)'` |
| Redirect to (302) | `createRuleWithBehavior()` | `behavior: 'Redirect To (302)'` |

### Testes Legados de Referencia

Os seguintes testes em `cypress/e2e/` mostram intents de Rules Engine:

- `edge-application/rules-engine/create-rule-engine.cy.js`
- `edge-application/rules-engine/create-rule-engine-set-cache-policy.cy.js`
- `edge-application/rules-engine/create-rule-engine-set-function.cy.js`
- `edge-firewall/create-edge-firewall-rule-engine-*.cy.js`

**Importante**: Use esses arquivos como referencia de INTENTS (o que testar), nao de implementacao. A implementacao deve usar os helpers documentados aqui.

---

## Migracoes v3 → v4

Algumas funcionalidades foram migradas ou renomeadas na versao v4. Ao criar testes, estar ciente dessas mudancas:

### Origins → Edge Connectors

**Origins** dentro de Edge Applications foi migrado para **Edge Connectors** como produto standalone.

| Antes (v3) | Depois (v4) |
|------------|-------------|
| `/edge-application/edit/{id}/origins` | `/connectors` (produto separado) |
| `v3/edge_applications/{id}/origins` | `v4/workspace/connectors` |
| Sub-recurso de Edge Application | Produto independente no sidebar |

**Testes**: `cypress/specs/edge-connectors/crud/`

### Domains → Workloads

**Domains** foi migrado para **Workloads** na versao v4.

| Antes (v3) | Depois (v4) |
|------------|-------------|
| `/domains` | `/workloads` (mesmo ListView) |
| `v3/domains` | `v4/workspace/workloads` |
| Sidebar: "Domains" | Rota: `/workloads` |

**Importante**: O item "Domains" no sidebar redireciona para `/workloads` na v4.

```javascript
// Ao testar Workloads/Domains:
cy.openProduct('Domains')  // Abre /workloads na v4
cy.url().should('match', /\/(domains|workloads)/)  // Aceitar ambos
```

**Testes**: `cypress/specs/workloads/crud/`

### Device Groups

**Device Groups** NAO foi migrado - permanece como sub-recurso de Edge Application.

| Aspecto | Status |
|---------|--------|
| Localizacao | Tab em Edge Application |
| API | `v4/workspace/applications/{id}/device_groups` |
| Condicao | `condition: true` (sempre disponivel) |

A diferenca entre v3 e v4 e apenas a **ordem das tabs**, controlada pela flag `hasFlagBlockApiV4()`:
- v4 mode: Device Groups em posicao 1 (Origins nao aparece - usa Edge Connectors)
- v3 mode: Origins posicao 1, Device Groups posicao 2

**Testes**: `cypress/specs/edge-applications/integration/device-groups.cy.js`

### Verificar Flag de Feature

```javascript
// Verificar se endpoint v4 esta bloqueado
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

// A flag 'block_apiv4_incompatible_endpoints' controla o modo:
// - FALSE = v4 mode (Edge Connectors, Workloads)
// - TRUE = v3 mode (Origins dentro de Edge App)
```

---

## Lidando com Estados Vazios

Ao criar testes de lista (read-list), considerar que a conta pode nao ter dados:

```javascript
it('should display table or empty state', () => {
  // Esperar por tabela OU estado vazio
  cy.get('.p-datatable, [class*="empty"], button:contains("Create")', { timeout: 30000 })
    .should('exist')

  cy.get('body').then(($body) => {
    if ($body.find('.p-datatable').length > 0) {
      // Verificar colunas da tabela
      cy.get('.p-datatable-thead').within(() => {
        cy.contains('th', 'Name').should('exist')
      })
    } else {
      // Estado vazio - verificar mensagem e botao de criar
      cy.contains('No').should('exist')
      cy.contains('button', 'Create').should('exist')
    }
  })
})
```

---

## Componentes de Formulario

### FieldSwitchBlock (Switches)

O componente `FieldSwitchBlock` gera data-testids com sufixos automaticos:

```javascript
// Componente Vue
<FieldSwitchBlock data-testid="domains-form__use-https-field" ... />

// Gera elementos com:
// - domains-form__use-https-field__selector (SelectorBlock wrapper)
// - domains-form__use-https-field__switch (InputSwitch element)
```

**Como testar:**

```javascript
// Errado: usar o wrapper
cy.get('[data-testid="domains-form__use-https-field"]').click()

// Certo: usar o switch para verificar estado e clicar
cy.get('[data-testid="domains-form__use-https-field__switch"]').then(($switch) => {
  if (!$switch.hasClass('p-inputswitch-checked')) {
    cy.wrap($switch).click()
  }
})
```

### FieldDropdownLazyLoader (Dropdowns com Lazy Loading)

**Arquivo fonte:** `src/templates/form-fields-inputs/fieldDropdownLazyLoader.vue`

Dropdowns que carregam dados via API precisam de tratamento especial.

**Sufixos gerados automaticamente:**

Se `data-testid="my-field"` é passado, o componente gera:

| Sufixo | Elemento | Uso |
|--------|----------|-----|
| `__label` | Label do campo | Identificar o label |
| `__dropdown` | O dropdown em si | Clicar para abrir |
| `__value` | Valor selecionado | Verificar seleção |
| `__clear-icon` | Ícone de limpar | Limpar seleção |
| `__loading-icon` | Ícone de loading | **Aguardar antes de interagir** |
| `__dropdown-search` | Campo de busca | Filtrar opções |
| `__dropdown-filter-input` | Input de filtro | Filtrar opções (alternativo) |
| `__dropdown-trigger` | Trigger do dropdown | Abrir dropdown |
| `__error-message` | Mensagem de erro | Validar erros |
| `__description` | Descrição | Texto auxiliar |

**Comportamentos importantes:**

1. **appendTo="self"** - O painel renderiza DENTRO do componente, não no body
2. **Virtual scroller** - Dados carregados sob demanda (100 itens por página)
3. **Search debounced** - 500ms de delay, mínimo 3 caracteres para busca
4. **Cache local** - Dados carregados no mount, não atualiza automaticamente
5. **Footer slot** - Botões de criação inline ficam no `<template #footer>`

**Como testar (IMPORTANTE):**

```javascript
// 1. Aguardar loading icon desaparecer
cy.get('[data-testid="domains-form__edge-application-field__loading-icon"]', { timeout: 5000 })
  .should('not.exist')

// 2. Clicar para abrir dropdown
cy.get('[data-testid="domains-form__edge-application-field__dropdown"]').click()

// 3. Aguardar opcoes renderizarem (virtual scroller precisa de tempo)
cy.get('li[role="option"]', { timeout: 10000 }).first().click()
```

**Cache e dados criados via API:**

Se um recurso é criado via API (não via interface), ele pode não aparecer no dropdown devido ao cache interno. Soluções:
1. **Preferir navegação via interface** para criar recursos durante testes
2. Fazer logout/login para limpar cache
3. O componente expõe `refreshData()` mas raramente é chamado externamente

**Erros comuns:**

```javascript
// Errado: clicar sem aguardar loading
cy.get(selectors.dropdown).click()
cy.get('li[role="option"]').click()  // Falha: opcoes ainda nao carregaram

// Errado: aguardar API mas nao o render
cy.wait('@getApplications')
cy.get(selectors.dropdown).click()
cy.get('li[role="option"]').click()  // Falha: virtual scroller pode nao ter renderizado

// Errado: buscar .p-dropdown-panel no body (com appendTo="self" está dentro do componente)
cy.get('.p-dropdown-panel').should('be.visible')  // Pode falhar dependendo do contexto
```

### FieldText (Campos de Texto)

Campos de texto sem `data-testid` explicito usam o padrao generico:

```javascript
// Componente Vue
<FieldText name="name" label="Name" ... />

// Se NAO tem data-testid explicito, gera:
// - field-text__input
// - field-text__label
// - field-text__error-message

// Se TEM data-testid explicito:
<FieldText data-testid="my-form__name-field" ... />
// Gera: my-form__name-field__input, etc.
```

**Como testar:**

```javascript
// Quando nao ha data-testid unico, usar .first() se houver multiplos
cy.get('[data-testid="field-text__input"]', { timeout: 10000 })
  .first()
  .clear()
  .type('MyValue')
```

### Formularios Longos (Scroll)

Formularios com muitas secoes requerem scroll antes de interagir:

```javascript
// Errado: elemento pode estar fora da viewport
cy.get(selectors.useHttpsSwitch).click()  // Falha: elemento nao visivel

// Certo: primeiro fazer scroll para a secao
cy.get('[data-testid="form-horizontal-protocol-settings"]').scrollIntoView()
cy.get(selectors.useHttpsSwitch).then(($switch) => {
  if (!$switch.hasClass('p-inputswitch-checked')) {
    cy.wrap($switch).click()
  }
})
```

**Secoes do formulario Workload (ordem):**
1. General (Name)
2. Infrastructure
3. Domains
4. Deployment Settings (Edge Application, Firewall)
5. Protocol Settings (HTTPS, HTTP/3, TLS)
6. Mutual Authentication Settings (mTLS)
7. Status

---

## Testes Funcionais - Workloads

Os testes funcionais de Workloads cobrem configuracoes alem do CRUD basico:

### HTTPS Configuration (`cypress/specs/workloads/functional/https-configuration.cy.js`)

| Teste | Descricao |
|-------|-----------|
| Enable HTTPS | Verifica que dropdown de certificado aparece |
| HTTPS Ports | Verifica que multiselect de portas HTTPS fica visivel |
| Disable HTTPS | Verifica que opcoes de certificado desaparecem |
| TLS Version | Verifica opcoes TLS v1.0, v1.2, v1.3 |
| Cipher Suite | Verifica dropdown de cipher suites |
| HTTP/3 | Verifica que HTTP/3 pode ser habilitado apos HTTPS |
| HTTP Ports | Verifica multiselect de portas HTTP |
| Create with HTTPS | Cria workload completo com HTTPS habilitado |

**Selectors importantes:**

```javascript
selectors = {
  protocolSettingsSection: '[data-testid="form-horizontal-protocol-settings"]',
  useHttpsSwitch: '[data-testid="domains-form__use-https-field__switch"]',
  useHttp3Switch: '[data-testid="domains-form__use-http3-field__switch"]',
  tlsVersion: '[data-testid="form-horizontal-delivery-settings-tls-version-field-dropdown__dropdown"]',
  cipherSuite: '[data-testid="form-horizontal-delivery-settings-cipher-suite-field-dropdown__dropdown"]',
  portHttp: '[data-testid="form-horizontal-delivery-settings-http-ports-multi-select"]',
  portHttps: '[data-testid="form-horizontal-delivery-settings-https-ports-multi-select"]'
}
```

**Valores de TLS (exatos):**
- `TLS v1.3 (Default)`
- `TLS v1.2`
- `TLS v1.1 (Deprecated)`
- `TLS v1.0 (Deprecated)`
- `None`

### mTLS Configuration (`cypress/specs/workloads/functional/mtls-configuration.cy.js`)

Mutual TLS requer HTTPS habilitado primeiro.

```javascript
// Habilitar HTTPS antes de mTLS
cy.get(selectors.useHttpsSwitch).click()

// Depois habilitar mTLS
cy.get(selectors.enableMtlsSelector).scrollIntoView()
cy.get(selectors.enableMtlsSwitch).click()

// Dropdown de Trusted CA deve aparecer
cy.get(selectors.dropdownTrustedCA).should('exist')
```

---

## Botoes de Criacao Inline (Dropdown Footer)

Alguns dropdowns possuem botao de "Create" no footer para criar recursos inline (sem sair do formulario atual). O botao so aparece **quando o dropdown esta aberto**.

### Como funciona

```vue
<!-- Estrutura do componente -->
<FieldDropdownLazyLoader appendTo="self" ...>
  <template #footer>
    <PrimeButton data-testid="domains-form__create-edge-application-button" />
  </template>
</FieldDropdownLazyLoader>
```

### Dropdowns com criacao inline em Workloads

| Dropdown | Botao | Recurso criado |
|----------|-------|----------------|
| Edge Application | `create-edge-application-button` | Edge Application via drawer |
| Edge Firewall | `create-edge-firewall-button` | Edge Firewall via drawer |
| Digital Certificate | `create-digital-certificate-button` | Certificado via drawer |

### Como testar

```javascript
// 1. Aguardar loading terminar
cy.get('[data-testid="domains-form__edge-application-field__loading-icon"]', { timeout: 5000 })
  .should('not.exist')

// 2. Abrir dropdown (o botao esta no footer)
cy.get(selectors.edgeApplicationField).scrollIntoView().click()

// 3. Aguardar botao ficar visivel no footer
cy.get('[data-testid="domains-form__create-edge-application-button"]', { timeout: 10000 })
  .should('be.visible')
  .click()

// 4. Drawer deve abrir
cy.get('.p-sidebar-content', { timeout: 10000 }).should('be.visible')
```

### Limitacoes conhecidas

- Dropdowns com `appendTo="self"` podem ter comportamento diferente do padrao
- O painel do dropdown pode fechar rapidamente em certas condicoes
- Testes de criacao inline sao mais complexos devido ao fluxo de drawer aninhado

---

## Referencias

- `cypress/support/console-kit-helpers/` - Implementacao dos helpers
- `cypress/support/console-kit-helpers/rules-engine.js` - Helpers de Rules Engine
- `cypress/specs/variables/` - Exemplo de estrutura completa
- `cypress/specs/edge-applications/integration/rules-engine.cy.js` - Teste de referencia
- `cypress/specs/workloads/crud/` - Testes de Workloads (ex-Domains)
- `cypress/specs/workloads/functional/` - Testes funcionais de HTTPS, mTLS
- `cypress/specs/edge-connectors/crud/` - Testes de Edge Connectors (ex-Origins)
- `cypress/e2e/` - Intents de testes legados (referencia, nao implementacao)
