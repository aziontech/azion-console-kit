# PaginatedDropdown (PrimeVue v3)

This document is the single source of truth for the `PaginatedDropdown` component. It is written for AI tooling and code assistants to understand exactly how this component behaves, how to use it, and how to change it safely. It contains explicit API contracts, data shapes, invariants, and realistic usage examples.

## Purpose

- Render a PrimeVue v3 `Dropdown` that lazy-loads options in pages.
- Load the next page automatically when the user scrolls to the bottom of the dropdown panel.
- Ensure a selected value that is NOT in the currently loaded pages is fetched individually by id (without loading the entire dataset).
- Prevent overfetching and duplicate options.
- Keep responsibilities focused: fetching + dropdown pagination + selected-by-id injection.

## When to Use

- Large datasets (100+ options) where fetching everything up-front is undesirable.
- You have a paginated list endpoint and a separate endpoint to fetch one item by id.
- You need client-side search (simple text filter) that resets the pagination.

## Component Location

- File: `src/components/Dropdown/PaginatedDropdown.vue`

## External Dependencies

- PrimeVue v3: `Dropdown` component

## Public API

### Props

- `modelValue: string | number | object | null` (default: `null`)

  - The current value of the dropdown. Can be a primitive id (e.g., `string | number`) or the full option object.
  - If primitive id is given and not present in loaded options, the component will call `getByIdService(id)` to fetch it and add it to the options list.

- `listService: Function` (required)

  - Signature: `async function listService({ page, size, search }): Promise<{ items: Array<object>, total: number }>`
  - Must return an object with:
    - `items`: an array of option objects
    - `total`: total count across all pages
  - Pagination is 1-based on `page`. `size` is the page size. `search` is a string (may be empty) used for filtering.

- `getByIdService: Function` (required)

  - Signature: `async function getByIdService(id): Promise<object | null>`
  - Fetches a single option by id. If returned, the item will be added to the options list if not present.

- `optionLabel: string` (default: `'label'`)

  - The property name on the option object used as the display label in the dropdown.

- `optionValue: string` (default: `'value'`)

  - The property name on the option object used as the unique identifier (id).

- `pageSize: number` (default: `25`)

  - The number of items to request per page.

- `placeholder: string` (default: `'Select'`)

  - Placeholder text for the dropdown input.

- `disabled: boolean` (default: `false`)

  - Disables the dropdown when true.

- `filter: boolean` (default: `true`)

  - Enables the built-in PrimeVue filter input. On filter, the component resets pagination and refetches the first page with `search`.

- `filterPlaceholder: string` (default: `'Search'`)

  - Placeholder for the filter input.

- `emptyMessage: string` (default: `'No results'`)
  - Message displayed when no options are available.

### Emits

- `update:modelValue` with payload `any`
  - Fired when the selection changes. Mirrors v-model behavior.
- `change` with payload `{ originalEvent, value }` (same event shape as PrimeVue `Dropdown`)
  - Fired on value change from user interaction.

### Slots

- `#empty`
  - Customize the empty state (default is the `emptyMessage` text).
- `#footer`
  - A sentinel `div` is rendered here internally to detect bottom intersection and trigger next page loading.

## Behavior Details

- Opening the dropdown (`@show`):

  1. If no options are loaded, fetch page 1 using `listService({ page: 1, size: pageSize, search })`.
  2. Ensure the selected value (from `modelValue`) is present: if not loaded and an id exists, fetch it via `getByIdService(id)` and add it.
  3. Set up an `IntersectionObserver` on a sentinel element in the dropdown footer. When the sentinel is visible (user scrolled to the end) and there are more items (`options.length < total`), fetch the next page and append.

- Hiding the dropdown (`@hide`):

  - Disconnect the `IntersectionObserver` to avoid background loads.

- Filtering (`@filter`):

  - On input change, reset pagination state and fetch the first page with the new `search` value.
  - After fetch, ensure the selected value is present via `getByIdService` if necessary.

- Change (`@change`):

  - Emits `update:modelValue` and `change` with the event data.

- Deduplication:

  - A `Set` of loaded ids is maintained to avoid duplicates across pages or when injecting the selected item.

- Concurrency/Guarding:
  - Guards against concurrent loads with `isLoading` / `isAppending` flags.

## Data Structures and Contracts

- Option object (example):

  ```json
  {
    "id": 123,
    "name": "Alice",
    "email": "alice@example.com"
  }
  ```

  - If `optionValue = "id"` and `optionLabel = "name"`, the dropdown will use `id` as the internal value and show `name`.

- `listService` return shape:

  ```json
  {
    "items": [
      {
        /* option */
      },
      {
        /* option */
      }
    ],
    "total": 130
  }
  ```

- `getByIdService` return shape:
  ```json
  { /* option */ } | null
  ```

## Realistic Usage Examples

### 1) Basic usage with numeric ids

```vue
<script setup>
  import PaginatedDropdown from '@/components/Dropdown/PaginatedDropdown.vue'
  import { userService } from '@/services/v2/users/user-service'

  const fetchUsersPaged = async ({ page, size, search }) => {
    const resp = await userService.list({ page, size, q: search })
    return { items: resp.items, total: resp.total }
  }

  const getUserById = async (id) => {
    return userService.getById(id)
  }

  const selectedUserId = ref(null)
</script>

<template>
  <PaginatedDropdown
    v-model="selectedUserId"
    :listService="fetchUsersPaged"
    :getByIdService="getUserById"
    optionLabel="name"
    optionValue="id"
    :pageSize="30"
    placeholder="Select a user"
  />
</template>
```

### 2) Model is the full object (not just id)

```vue
<script setup>
  import PaginatedDropdown from '@/components/Dropdown/PaginatedDropdown.vue'
  import { groupsService } from '@/services/v2/groups/groups-service'

  const listGroups = async ({ page, size, search }) => {
    const { data } = await groupsService.list({ page, size, search })
    return { items: data.items, total: data.total }
  }

  const getGroupById = async (id) => groupsService.getById(id)

  const selectedGroup = ref(null)
</script>

<template>
  <PaginatedDropdown
    v-model="selectedGroup"
    :listService="listGroups"
    :getByIdService="getGroupById"
    optionLabel="title"
    optionValue="id"
  />
</template>
```

## Known Constraints / Edge Cases

- The component assumes `optionValue` uniquely identifies options. Duplicated ids across pages will be deduped (later duplicates ignored).
- If `getByIdService` fails (e.g., 404), the selected id will not be injected; the component will continue to function with loaded pages only.
- Filtering is client-driven via `@filter` from PrimeVue. The `search` string is passed to `listService`. The service is responsible for applying the server-side filtering.
- Pagination is forward-only (no backtracking). The dropdown loads the next page when near the bottom; it does not unload earlier pages.
- The `IntersectionObserver` relies on the dropdown panel structure (`.p-dropdown-panel .p-dropdown-items`). If PrimeVue markup changes in future versions, `panelScrollableRoot()` may need updates.
- The component will not fetch any page until the dropdown is opened (lazy on `@show`).

## Architectural Intent

- Replace legacy lazy-load dropdown with a clear, maintainable, single-responsibility component:
  - Fetch paginated options on demand.
  - Append next pages on bottom intersection.
  - Ensure selected id is present without loading all pages.
  - Minimize redundant requests (guards + dedupe).
- Keep API explicit and stable so other components can rely on it without needing to know its internal mechanics.

## Internal State (for reference)

- `internalValue`: mirrors `modelValue`.
- `options: Array<object>`: accumulated options fetched/inserted.
- `loadedIds: Set<any>`: ids included in `options` (using `optionValue`).
- `total: number`: total records reported by `listService`.
- `page: number`: next page to fetch (starts at 1; incremented when a page returns items).
- `search: string`: current search term (from PrimeVue filter).
- `isLoading: boolean`: true when fetching initial page.
- `isAppending: boolean`: true when fetching next pages.
- `isOpen: boolean`: whether dropdown panel is open.

## Non-Goals

- No virtual scrolling; it uses paginated append and native rendering of items.
- No multi-select; this is a single-selection dropdown.
- No custom option templating here (can be added via slots in a future iteration if needed).

## Change Safety Checklist

- When changing the DOM selection in `panelScrollableRoot()`, validate the observer still binds to the scroll container.
- When altering props or events, update this README accordingly and provide a migration guide if breaking.
- Keep `listService` and `getByIdService` signatures backward-compatible.
- Ensure deduplication remains correct when adding transformations to items.
