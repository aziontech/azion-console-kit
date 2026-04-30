# Testing

## Overview

The Console Kit uses two complementary testing frameworks:

- **Vitest** — Unit and integration tests for services, composables, and component logic
- **Cypress** — End-to-end user journey tests against a running environment

This document covers the Cypress E2E infrastructure.

## Quick Start

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure credentials

Copy the example env file and fill in your credentials:

```bash
cp tests/cypress/cypress.env.example.json cypress.env.json
```

Edit `cypress.env.json` with valid credentials for the target environment. This file is gitignored and must never be committed.

### 3. Run tests

```bash
# Against a local dev server
npx cypress run --spec "tests/cypress/specs/**/*.cy.js"

# Against a specific environment
npx cypress run \
  --spec "tests/cypress/specs/**/*.cy.js" \
  --env environment=stage,baseUrl=https://your-environment-url.example.com \
  --config baseUrl=https://your-environment-url.example.com
```

> **Note:** Both `--env baseUrl` and `--config baseUrl` must be set due to a [known Cypress issue](https://github.com/cypress-io/cypress/issues/20647).

### 4. Open interactive mode

```bash
npx cypress open
```

## Project Structure

```
tests/cypress/
  specs/                          # Test specifications
    auth/                         # Authentication tests
      login.cy.js
    smoke/                        # Smoke tests
      sidebar-navigation.cy.js
    {module}/                     # Module-specific tests
      crud/
        create.cy.js
        read-list.cy.js
        update.cy.js
        delete.cy.js
      integration/
        {sub-resource}.cy.js

  support/
    commands.js                   # Custom Cypress commands (login, toast, delete)
    selectors.js                  # Barrel file for all selectors
    selectors/
      block-selectors/            # Shared UI block selectors (list table, form, sidebar, account menu)
      product-selectors/          # Product-specific selectors (variables, edge-app, etc.)
      view-selectors/             # View-specific selectors (login, your-settings)
    console-kit-helpers/
      table.js                    # List table interaction helpers
      navigation.js               # Product route and sidebar ID mapping
      fixture-recorder.js          # API fixture record/replay for offline testing
```

## Key Patterns

### Empty Data Resilience

Tests must handle empty lists gracefully. The test account may have no data for some modules.

```javascript
let hasData = false

it('should display the list or empty state', () => {
  cy.visit('/variables')
  cy.get(selectors.list.container, { timeout: 30000 }).should('exist')

  cy.get('body').then(($body) => {
    if ($body.find(selectors.list.actionsMenu.button).length > 0) {
      hasData = true
    }
  })
})

it('should open first item for editing', () => {
  if (!hasData) {
    cy.log('Skipping - no data')
    return
  }
  // ... interact with row data
})
```

Check `actionsMenu.button` length for row existence, not `dataTable` — table headers exist even when empty.

### Toast Assertions

Toasts use opacity transitions and fade quickly. Always use `.should('exist')` instead of `.should('be.visible')`:

```javascript
// Correct
cy.get('.p-toast-message-success', { timeout: 10000 }).should('exist')

// Wrong — may fail due to opacity transition
cy.get('.p-toast-message-success').should('be.visible')
```

### Webkit Field Selectors

Webkit field components apply `data-testid` on wrapper elements. The interactive element needs a suffix:

| Component | Suffix | Notes |
|---|---|---|
| FieldText | `__input` | Targets `<input>` directly |
| FieldPassword | `__input` | Targets `<div>` — append ` input` for `<input>` |
| FieldDropdown | `__dropdown` | Dropdown trigger |
| FieldMultiSelect | `__multiselect` | Multiselect trigger |
| FieldSwitchBlock | `__switch` | Switch slider |
| All fields | `__error-message` | Validation error |

**FieldPassword caveat:** The `__input` suffix lands on a PrimeVue Password `<div>`, not the actual `<input>`. Append ` input` to target the typeable element:

```javascript
cy.get('[data-testid="my-form__password__input"] input').type('secret')
```

### Navigation

Always use `cy.visit('/path')` instead of `cy.openProduct()` after login — it's more reliable with session cache:

```javascript
// Correct
cy.visit('/variables')

// Less reliable after session restore
cy.openProduct('Variables')
```

Verify routes in `src/router/routes/` — don't guess paths. Common gotchas:
- `/settings` not `/your-settings`
- `/applications` not `/edge-application`
- `/firewalls` not `/edge-firewall`

### Account Limits

Create tests must handle quota errors since the test account may have limits:

```javascript
let created = false

it('should submit create form', () => {
  cy.get(selectors.form.actionsSubmitButton).click()

  cy.get('.p-toast-message', { timeout: 10000 }).should('exist').then(($toast) => {
    if ($toast.hasClass('p-toast-message-success')) {
      created = true
    } else {
      cy.log('Create failed (possible account limit)')
    }
  })
})
```

### Cleanup

Always clean up created resources in `after()` hooks, but only when creation succeeded:

```javascript
after(() => {
  if (created) {
    cy.visit('/variables')
    tableHelpers.waitForListReady()
    tableHelpers.searchFor(entityName)
    cy.get('body').then(($body) => {
      if ($body.find(selectors.list.actionsMenu.button).length > 0) {
        tableHelpers.deleteFirstRow()
      }
    })
  }
})
```

## Custom Commands

| Command | Description |
|---|---|
| `cy.login()` | Authenticates using env-based credentials with session caching |
| `cy.openProduct(name)` | Opens a product via sidebar or account menu |
| `cy.verifyToast(summary, detail)` | Asserts a toast message exists |
| `cy.deleteEntityFromList({...})` | Searches and deletes an entity from a product list |
| `cy.deleteEntityFromLoadedList()` | Deletes the first entity from the currently loaded list |

## Helpers

### `tableHelpers` (table.js)

| Method | Description |
|---|---|
| `waitForListReady()` | Waits for list container and data table |
| `searchFor(term)` | Types a search term into the list search input |
| `openActionsMenu()` | Opens the actions menu for the first row |
| `clickActionsMenuItem(label)` | Clicks a menu item from the actions menu |
| `deleteFirstRow()` | Performs the full delete flow on the first row |
| `clickCreateButton(module)` | Clicks the create button for a module |
| `verifyColumnValue(col, val)` | Asserts a column contains a value |

### `fixtureRecorder` (fixture-recorder.js)

Supports three modes via `Cypress.env('fixtureMode')`:
- **live** (default) — No mocking, real API calls with aliases
- **record** — Passes through to real server, saves responses as fixtures
- **replay** — Responds with previously recorded fixtures

### `navigation` (navigation.js)

Maps product display names to sidebar IDs and route paths. Use `getRoute('Variables')` to get `/variables`.

## Generating New Tests

AI-assisted test generation skills are available for generating Cypress specs from code diffs. Ask your team lead for access.

When writing tests manually, follow the patterns above and use existing specs as reference implementations.

## CI Configuration

### Credentials

Credentials are provided via GitHub Actions secrets:
- `secrets.STAGE_CYPRESS_EMAIL` / `secrets.STAGE_CYPRESS_PASSWORD`
- Additional environment-specific secrets as needed

### Environment Configuration

The environment is selected via the `environment` env var:

```yaml
- name: Run Cypress E2E
  run: npx cypress run --spec "tests/cypress/specs/**/*.cy.js"
  env:
    CYPRESS_environment: stage
    CYPRESS_baseUrl: ${{ vars.STAGE_BASE_URL }}
    CYPRESS_STAGE_CYPRESS_EMAIL: ${{ secrets.STAGE_CYPRESS_EMAIL }}
    CYPRESS_STAGE_CYPRESS_PASSWORD: ${{ secrets.STAGE_CYPRESS_PASSWORD }}
```

### Code Coverage

The coverage pipeline uses:
1. `vite-plugin-istanbul` to instrument code during build
2. `@cypress/code-coverage` to collect coverage during test execution
3. `nyc` to generate reports → `./coverage/e2e/lcov.info`

For diff coverage (validating that new/changed lines are covered):

```bash
pip install diff-cover
diff-cover ./coverage/e2e/lcov.info --compare-branch origin/dev --fail-under 80
```

## Configuration

Key settings in `cypress.config.js`:
- `specPattern`: `tests/cypress/specs/**/*.cy.{js,ts}`
- `supportFile`: `tests/cypress/support/e2e.js`
- `testIsolation: false` — specs share session state for performance
- `defaultCommandTimeout: 60000` — generous timeout for slow environments
- Video recording enabled, auto-deleted on passing specs
