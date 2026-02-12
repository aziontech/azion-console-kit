# Development Guide

This guide provides detailed information for developers working on Azion Console Kit.

## Table of Contents

- [IDE Setup](#ide-setup)
- [Project Architecture](#project-architecture)
- [Composables](#composables)
- [Modules](#modules)
- [Plugins](#plugins)
- [Creating a New Feature](#creating-a-new-feature)
- [Theming](#theming)
- [API Configuration](#api-configuration)
- [Build & Deploy](#build--deploy)
- [Testing](#testing)
- [Useful Resources](#useful-resources)

---

## IDE Setup

### Recommended VSCode Extensions

For the best development experience, install these extensions:

| Extension | Purpose |
|-----------|---------|
| [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) | Vue 3 language support (disable Vetur) |
| [TypeScript Vue Plugin](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) | TypeScript support for Vue |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | Code formatting |
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Linting |
| [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) | Tailwind autocomplete |

### VSCode Settings

Enable auto-format on save by creating `.vscode/settings.json`:

```json
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "vue"],
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "files.insertFinalNewline": true
}
```

> **Note:** This file should not be committed to avoid affecting other developers' IDE preferences.

---

## Project Architecture

### Directory Structure

```
src/
├── App.vue
├── assets/              # Static files (CSS, images, themes)
│   └── themes/
├── router/              # Route definitions
│   ├── routes/
│   │   ├── edge-application-routes/
│   │   └── variables-routes/
│   └── index.js
├── services/            # API service layer
│   ├── axios/
│   ├── edge-application-services/
│   └── variables-services/
├── stores/              # Pinia state management
├── templates/           # Reusable UI blocks
│   ├── create-form-block/
│   ├── footer-block/
│   ├── list-table-block/
│   ├── main-menu-block/
│   └── shell-block/
└── views/               # Page components
    ├── EdgeApplications/
    │   ├── ListView.vue
    │   └── CreateView.vue
    └── Variables/
        ├── ListView.vue
        └── FormView.vue
```

### Directory Descriptions

| Directory | Description |
|-----------|-------------|
| `assets/` | Static project files (CSS, images, etc.) |
| `router/` | Route structure, where `index.js` centralizes all routes |
| `services/` | Services separated by CRUD operation |
| `stores/` | Data that needs to be shared between UIs/routes |
| `templates/` | Pre-built blocks for project construction, ready for integration |
| `views/` | Folders separated by modules, containing each UI needed for CRUDL operations |

### Architecture Diagram

Below you can see a diagram showing how these files are organized and interconnect to implement a CRUDL module:

![Architecture Diagram](./docs/architecture-diagram.png)

---

## Composables

Composables are reusable Vue 3 Composition API functions located in `src/composables/`. They encapsulate common logic that can be shared across components.

### Available Composables

| Composable | Description |
|------------|-------------|
| `useDataTable` | Complete data table logic including pagination, sorting, filtering, and CRUD operations |
| `useDeleteDialog` | Opens standardized delete confirmation dialogs with customizable options |
| `useTableQuery` | Handles table data fetching with support for pagination, sorting, and search |
| `useEdgeStorage` | Manages Edge Storage bucket operations (upload, download, delete files) |
| `useScrollToError` | Automatically scrolls to the first form validation error |
| `useResize` | Handles element resize observations |
| `useLayout` | Manages application layout state (sidebar, header, etc.) |
| `useHelperCenter` | Integrates with the help center functionality |
| `userFlag` | Handles feature flag checks |

### Usage Examples

**useDeleteDialog:**
```javascript
import { useDeleteDialog } from '@/composables/useDeleteDialog'

const { openDeleteDialog } = useDeleteDialog()

openDeleteDialog({
  title: 'Delete Variable',
  data: selectedItem,
  deleteService: () => deleteVariableService(selectedItem.id),
  successCallback: () => reloadTable()
})
```

**useScrollToError:**
```javascript
import { useScrollToError } from '@/composables/useScrollToError'

const { scrollToError, scrollToErrorInDrawer } = useScrollToError()

// After form validation fails
scrollToError(errors)

// For forms inside drawers/sidebars
scrollToErrorInDrawer(errors)
```

**useTableQuery:**
```javascript
import { useTableQuery } from '@/composables/useTableQuery'

const {
  isLoading,
  data,
  totalRecords,
  reload,
  updateSort,
  updatePagination,
  updateSearch
} = useTableQuery({
  listService: listVariablesService,
  defaultOrderingFieldName: 'name',
  itemsByPage: 10
})
```

---

## Modules

Modules are self-contained feature packages located in `src/modules/`. Each module contains its own components, services, composables, and assets.

### Available Modules

| Module | Description |
|--------|-------------|
| `azion-ai-chat/` | AI-powered chat assistant integration |
| `real-time-events/` | Real-time event streaming and display |
| `real-time-metrics/` | Real-time metrics dashboard and visualizations |

### Module Structure

Each module follows a consistent structure:

```
src/modules/azion-ai-chat/
├── assets/           # Module-specific static files
├── components/       # Module-specific Vue components
├── composables/      # Module-specific composables
├── contextual-prompts/  # AI prompt configurations
├── directives/       # Vue directives
├── layout/           # Layout components
└── services/         # API services for the module
```

### Using Modules

Modules are typically imported and used as needed:

```javascript
import AzionAiChat from '@/modules/azion-ai-chat'
```

---

## Plugins

Plugins extend Vue's functionality and are located in `src/plugins/`. They are registered globally in `main.js`.

### Available Plugins

| Plugin | Description |
|--------|-------------|
| `AnalyticsTrackerAdapterPlugin` | Segment analytics integration for tracking user events |
| `sentry/` | Sentry error tracking and session replay |

### Analytics Plugin

The analytics plugin provides a global `$tracker` instance for tracking user events:

```javascript
// In a component
this.$tracker.track('button_clicked', { buttonName: 'submit' })

// Using inject in Composition API
import { inject } from 'vue'
const tracker = inject('tracker')
tracker.track('page_viewed', { pageName: 'Dashboard' })
```

### Sentry Plugin

The Sentry plugin provides error tracking and session replay. It exposes methods via `$sentry`:

```javascript
// Capture an exception
this.$sentry.captureException(error)

// Capture a message
this.$sentry.captureMessage('Something happened')

// Set user context
this.$sentry.setUser({ id: userId, email: userEmail })

// Set custom tags
this.$sentry.setTag('feature', 'edge-applications')
```

#### Sentry Configuration

Configure Sentry via environment variables:

```bash
VITE_SENTRY_UPLOAD=true          # Enable source map uploads
VITE_SENTRY_AUTH_TOKEN=sntrys_...  # Sentry auth token
```

#### Masking Sensitive Data

Use `data-sentry-mask` attribute to mask sensitive content in session replays:

```html
<input type="password" data-sentry-mask />
<div data-sentry-mask>Sensitive content</div>
```

---

## Creating a New Feature

This section walks through creating a new feature using the Variables module as an example.

### Step 1: Create the Service

Create a new folder in `src/services/` for your feature:

```
src/services/variables-services/
├── make-variables-base-url.js   # Base URL getter for the API
├── index.js                      # Exports all methods (List, Edit, Delete, Create)
└── list-variables-service.js     # API call layer with payload normalization
```

**Example: `make-variables-base-url.js`**
```javascript
export const makeVariablesBaseUrl = () => {
  return 'v4/variables'
}
```

**Example: `list-variables-service.js`**
```javascript
import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeVariablesBaseUrl } from './make-variables-base-url'

export const listVariablesService = async () => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: makeVariablesBaseUrl(),
    method: 'GET'
  })
  
  return adapt(httpResponse)
}

const adapt = (httpResponse) => {
  // Normalize and transform the response
  return httpResponse.body.results.map((item) => ({
    id: item.uuid,
    key: item.key,
    value: item.value
  }))
}
```

### Step 2: Create the View

Create your view component in `src/views/YourFeature/`:

```vue
<!-- src/views/Variables/ListView.vue -->
<template>
  <ListTableBlock
    :listService="listVariablesService"
    :columns="columns"
    :deleteService="deleteVariablesService"
  />
</template>

<script setup>
import ListTableBlock from '@/templates/list-table-block'
import { listVariablesService, deleteVariablesService } from '@/services/variables-services'

const columns = [
  { field: 'key', header: 'Key' },
  { field: 'value', header: 'Value' }
]
</script>
```

### Step 3: Create the Route

Add your route in `src/router/index.js`:

```javascript
import { listVariablesService, deleteVariablesService } from '@/services/variables-services'

const routes = [
  {
    path: '/variables',
    name: 'list-variables',
    component: () => import('@/views/Variables/ListView.vue'),
    props: {
      listService: listVariablesService,
      deleteService: deleteVariablesService
    }
  }
]
```

### Step 4: Add to Menu (Optional)

Configure the menu item in `src/templates/main-menu-block/`:

```javascript
{
  label: 'Variables',
  icon: 'pi pi-cog',
  to: '/variables'
}
```

---

## Theming

### CSS Customization

The application uses Azion's default theme. The theme is loaded in `src/main.js`:

```javascript
import '@/assets/themes/scss/themes/azion-light/theme.scss'
```

Theme source files are located in `src/assets/themes/scss`. Changes to token files or any files in these directories will reflect immediately in your development environment.

### Logo Customization

The logo file is located at `assets/svg/logo.vue` and can be replaced with a custom SVG file.

---

## API Configuration

### Using the Stage API

For Azion team development, you can point to the stage API:

1. Set the environment variable:
   ```bash
   VITE_ENVIRONMENT=stage
   ```

2. Or modify `vite.config.js` proxy target:
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'https://stage-api.azion.net',
         changeOrigin: true,
         rewrite: (path) => path.replace(/^\/api/, ''),
       }
     }
   }
   ```

---

## Build & Deploy

### Build for Production

```bash
yarn build
```

### Preview Production Build Locally

```bash
yarn preview
```

### Deploy with Azion CLI

```bash
yarn build
azion link        # Select Vue preset
azion deploy
```

### Deploy with GitHub Actions

Configure these repository secrets:

| Secret | Description |
|--------|-------------|
| `PLATFORM_KIT_TOKEN` | Your Azion personal token for CLI deployment |
| `APPLICATION_ID` | Edge Application ID from first deploy |
| `FUNCTION_ID` | Edge Function ID from first deploy |
| `DOMAIN_ID` | Domain ID linked to the Edge Application |

> **Note:** These IDs are available in `azion/azion.json` after the first deploy.

---

## Testing

### Unit Tests with Vitest

```bash
# Run with UI
yarn test:unit

# Run headless
yarn test:unit:headless

# Run with coverage
yarn test:unit:coverage
```

### E2E Tests with Cypress

1. Copy `cypress.env.example.json` to `cypress.env.json`
2. Fill in valid credentials for your target environment

```bash
# Open Cypress UI
yarn test:e2e:open:dev

# Run headless
yarn test:e2e:run:dev
```

For CI environments, run tests against the production build:

```bash
yarn build
yarn test:e2e:run:stage
```

### Linting

```bash
yarn lint
```

---

## Useful Resources

- [VeeValidate Guide](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started/)
- [Yup with VeeValidate](https://vee-validate.logaretm.com/v4/guide/composition-api/getting-started/#validating-with-yup)
- [Vue 3 Documentation](https://vuejs.org/guide/introduction.html)
- [PrimeVue Components](https://primevue.org/setup)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Pinia State Management](https://pinia.vuejs.org/)
