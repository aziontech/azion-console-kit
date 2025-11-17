# PaginatedDropdown (PrimeVue v3)

This document describes `PaginatedDropdown.vue` as implemented today. It focuses on an accurate, concise API and the internal behavior needed for maintenance and AI tooling.

## Purpose

- Lazy-load options page-by-page (VirtualScroller).
- Remote-only search with debounce (no local filtering).
- Ensure a selected value is visible even if not in the first pages (fetch-by-id injection).
- Avoid over-fetching and duplicates.

## Location

- `src/components/Dropdown/PaginatedDropdown.vue`

## Dependencies

- PrimeVue `Dropdown`, `InputText`
- Vue 3 Composition API
- `@vueuse/core` (watchDebounced)

## Props

- `modelValue: string | number | object | null` — current value (id or object)
- `listService: ({ page, pageSize, search }) => Promise<{ body: any[], count: number }>` — required
- `getByIdService: (id) => Promise<any>` — required
- `optionLabel: string` (default `label`)
- `optionValue: string` (default `value`)
- `name: string` — used for `id`/`name` and LabelBlock
- `label: string` — renders LabelBlock above the field
- `pageSize: number` (default `100`)
- `placeholder: string` (default `Select`)
- `disabled: boolean` (default `false`)
- `filterPlaceholder: string` (default `Search`) — header input placeholder
- `emptyMessage: string` (default `No results`)
- `showIcon: boolean` (default `false`)
- `iconColor: Record<string,string>` (default `{}`)
- `filter: boolean` (default `true`) — deprecated, not used
- `moreOptions: string[]` (default `[]`) — when set, `onSelectOption` emits only these fields from the selected option

## Emits

- `update:modelValue` — selected value (id or object)
- `onSelectOption` —
  - If `moreOptions.length > 0`: emits `{ [key]: option[key] }` for each key in `moreOptions`
  - Else: emits the raw selected value

## Slots

## Behavior

- Open: if no options, fetch `{ page: 1, pageSize, search }`; then ensure selected is loaded by id
- Infinite scroll: VirtualScroller `onLazyLoad` appends next page when reaching the end and `hasMore`
- End-of-data: stop paging when a page returns `< pageSize` or when `options.length >= total`
- Remote search: debounced `watchDebounced(search)` fires when length >= 3 or cleared (0), resets state and fetches page 1
- Deduplication: `loadedIds` set ensures unique items by `optionValue`
- Guards: prevent concurrent loads and avoid paging when `noMore`

## Internal Overview

- State: `internalValue`, `options`, `loadedIds`, `page`, `total`, `noMore`, `search`, `isLoading`, `isAppending`, `isOpen`
- Computed: `hasMore`
- Helpers: `optionId`, `getSelectedOption`, `applyIconColor`, `buildListParams`, `markEndOfData`, `addOptions`, `resetState`, `isEndOfList`, `canAppend`
- Fetchers: `fetchPage({ append })`, `ensureSelectedLoaded()`

## Examples

Basic:

```vue
<PaginatedDropdown
  v-model="appId"
  name="application"
  label="Application"
  :listService="listApps"
  :getByIdService="loadAppById"
  optionLabel="name"
  optionValue="id"
  placeholder="Select an Application"
/>
```

Emit only `name` and `id` on select:

```vue
<PaginatedDropdown
  v-model="appId"
  :listService="listApps"
  :getByIdService="loadAppById"
  optionLabel="name"
  optionValue="id"
  :moreOptions="['name', 'id']"
  @onSelectOption="handleSelect"
/>
```

```js
function handleSelect(payload) {
  // { name: string, id: number }
}
```

## Notes

- `listService` must return `{ body, count }`
- Keep `pageSize` aligned with backend pagination
- Local filter is disabled by design; all searches are remote and debounced
