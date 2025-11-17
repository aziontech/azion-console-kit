# PaginatedDropdown

A PrimeVue Dropdown wrapper with remote search and true infinite scroll. Fetches data page-by-page from a service, supports debounced server-side filtering, and displays selected values consistently whether `v-model` is an id or an object.

## Key Features

- Single initial request on open (default `pageSize = 100`).
- Infinite scroll via PrimeVue VirtualScroller `onLazyLoad`.
- End-of-data detection to stop further requests when fewer than `pageSize` items are returned or when `total` is reached.
- Remote-only search with debounced requests (no local filtering).
- Optional label block via `LabelBlock` with `label` and `name` props.
- Custom value/option templates with optional icons.

## API

### Props

- `modelValue: string | number | object | null`
  Selected value. Can be an id or the full option object.
- `listService: ({ page, pageSize, search }) => Promise<{ body: any[], count: number }>`
  Remote list fetcher. Must return `{ body, count }`.
- `getByIdService: (id: string | number) => Promise<any>`
  Fetches a single item by id to ensure selected item is available in `options`.
- `optionLabel: string` (default: `label`)
  Field name to show as label. Example: `name`.
- `optionValue: string` (default: `value`)
  Field name used as the option id. Example: `id`.
- `name: string` (default: ``)
Used for `id`/`name`and LabelBlock`for` binding.
- `label: string` (default: ``)
Renders a `LabelBlock` above the dropdown when provided.
- `pageSize: number` (default: `100`)
  Page size for listService.
- `placeholder: string` (default: `Select`)
- `disabled: boolean` (default: `false`)
- `filterPlaceholder: string` (default: `Search`)
  Placeholder for the header search input.
- `emptyMessage: string` (default: `No results`)
- `showIcon: boolean` (default: `false`)
  When true, reserves space for icons in options without `icon`.
- `iconColor: Record<string, string>` (default: `{}`)
  Map of icon class => extra color class.
- `filter: boolean` (default: `true`) [deprecated]
  No longer used; search is remote-only via the header input and debounced watcher.

### Emits

- `update:modelValue` — emitted on change with the new value.
- `change` — forwards PrimeVue Dropdown `change` event.

### Slots

- `#header` — Contains the built-in search input bound to `search`.
- `#option` — Renders each option (icon + label). Uses `optionLabel` fallback to `name`.
- `#value` — Renders the selected option by resolving it from `options` using `optionValue`.
- `#footer` — Append custom content (e.g., create button).

## Behavior

- On open: if `options` is empty, performs a single request with `{ page: 1, pageSize, search }`.
- Scroll to end: VirtualScroller calls `onLazyLoad`; component loads the next page if `hasMore`.
- End-of-data: when fewer than `pageSize` items are returned or when `options.length >= total`, sets `noMore` and stops further paging.
- Remote search: header input updates `search`; a debounced watcher resets pagination and refetches. Thresholds:
  - Only search when `search.length >= 3` or `search.length === 0` (clear).

## Usage Example

```vue
<template>
  <PaginatedDropdown
    v-model="application"
    name="application"
    label="Application"
    :listService="listEdgeApplications"
    :getByIdService="loadEdgeApplicationById"
    optionLabel="name"
    optionValue="id"
    placeholder="Select an Application"
  >
    <template #footer>
      <Button
        text
        size="small"
        icon="pi pi-plus-circle"
        @click="openCreate"
      />
    </template>
  </PaginatedDropdown>
</template>

<script setup>
  import PaginatedDropdown from '@/components/Dropdown/PaginatedDropdown.vue'
  import Button from 'primevue/button'
  import { ref } from 'vue'

  const application = ref(null)

  const listEdgeApplications = async ({ page, pageSize, search }) => {
    // Must return { body: [...], count: number }
    const res = await api.listEdgeApps({ page, pageSize, search })
    return { body: res.items, count: res.total }
  }

  const loadEdgeApplicationById = async (id) => {
    return api.getEdgeAppById(id)
  }

  const openCreate = () => {
    /* ... */
  }
</script>
```

## Internal Structure (high-level)

- State: `internalValue`, `options`, `loadedIds`, `page`, `total`, `noMore`, `search`, `isLoading`, `isAppending`.
- Derived: `hasMore` computed.
- Helpers:
  - `optionId(opt)` — returns the id using `optionValue`.
  - `applyIconColor(icon)` — maps icon class to color class.
  - `getSelectedOption(val)` — resolves the selected option from `options`.
  - `buildListParams()` — builds list request params.
  - `markEndOfData(count)` — sets `noMore` when fewer than `pageSize` or `options.length >= total`.
  - `addOptions(items)` — merges unique items immutably.
  - `resetState()` — resets pagination/search and option cache.
- Fetch:
  - `fetchPage({ append })` — calls `listService` and merges results; increments page; marks end-of-data.
  - `ensureSelectedLoaded()` — fetches selected item by id if missing.
- Lifecycle:
  - `onShow()` — opens, fetches initial page if needed, ensures selected loaded.
  - `onHide()` — marks closed.
- Virtual scroller:
  - `handleLazyLoad({ last })` — if end-of-list and `canAppend`, fetch next page.
- Search (remote-only):
  - Header `<InputText v-model="search" />`.
  - `watchDebounced(search)` — resets and fetches when threshold rules match.

## Notes & Best Practices

- Ensure `listService` returns `{ body, count }` consistently.
- Choose `optionLabel`/`optionValue` to match response fields (e.g., `name`/`id`).
- Keep `pageSize` aligned with backend pagination; the end-of-data rule relies on it.
- Avoid local filtering; remote search is handled entirely via the debounced watcher.
- The `filter` prop is deprecated and ignored.

## Changelog (recent)

- Switched to VirtualScroller `onLazyLoad` for paging.
- Implemented `noMore` end-of-data logic.
- Remote-only search via debounced watcher and header input.
- Immutable updates in `addOptions` for better reactivity.
- Consistent selected value rendering via `getSelectedOption`.
