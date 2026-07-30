# Changelog

All notable changes to Azion Console Kit are recorded here. Format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Real-Time Events V2: query sharing via shareable links. Click **Share**
  to copy a URL that encodes the current filters, dataset, page size, and
  selected fields into a `?shareState=…` parameter. Recipients pasting the
  URL into a new tab see the same view.
- Real-Time Events V2: saved searches persistence. Apply filters and
  click **Save** to name and persist the current view in `localStorage`,
  scoped per account/tenant. Survives reload; visible in the saved-search
  dropdown.
- ESLint rule `azion-architecture/no-unawaited-clipboard` (`error`).
  Flags `navigator.clipboard.writeText(...)` calls that are not awaited
  or explicitly handled with `.then/.catch`. Prevents the
  share-toast-fires-before-clipboard-write regression.
- Real-Time Events V2: `FallbackCopyDialog` for browsers and contexts
  where the Clipboard API is unavailable (Safari over HTTP, restrictive
  permission policies). Renders a read-only input with the URL plus a
  legacy `document.execCommand('copy')` button.

### Changed
- Real-Time Events V2: Add Filter modal width is now stable across
  field/operator changes. Responsive sizing: `min(35rem, 90vw)` on
  desktop, `calc(100vw - 1rem)` on mobile. Touch targets meet WCAG 2.5.5
  (44×44 px minimum).
- Real-Time Events V2: dataset-aware GraphQL aggregation. A new
  `DATASET_SUPPORTS_GROUPBY` whitelist in `load-events-aggregation.js`
  routes the five datasets that only accept `groupBy: [ts]` (Function
  Events, Function Console Events, Data Stream Events, Edge DNS Queries,
  Activity History) away from unsupported groupings.

### Fixed
- Real-Time Events V2: `navigator.clipboard.writeText()` in
  `shareCurrentView()` is now properly awaited, so the success toast no
  longer fires before the OS clipboard accepts the write. Failure cases
  now route to the fallback dialog or an error toast.
- Real-Time Events V2: five dataset tabs no longer crash on initial load
  with a GraphQL "field not supported in groupBy" error.

### Observability
- Structured logs added: `share_url_copied` (success, with URL length),
  `useSavedSearches: save | delete | apply` (CRUD audit),
  `[real-time-events] GraphQL query failed` (error path with dataset and
  groupByField context). See `specs/real-time-events-v2-improvements/FEATURE.md`.
