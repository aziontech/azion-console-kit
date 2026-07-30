<script setup>
  import {
    ref,
    computed,
    watch,
    onMounted,
    onBeforeUnmount,
    onActivated,
    onDeactivated,
    nextTick
  } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import Skeleton from '@aziontech/webkit/skeleton'
  import EmptyResultsBlock from '@aziontech/webkit/empty-results-block'
  import EventDocumentView from './event-document-view.vue'
  import LogFieldBadges from './log-field-badges.vue'
  import { useRowWindow } from '../../composables/useRowWindow.js'
  import { useOverflowMeasure } from '../../composables/useOverflowMeasure.js'
  import { useRowHeightObserver } from '../../composables/useRowHeightObserver.js'
  import { useColumnResize } from '../../composables/useColumnResize.js'
  import {
    distributeColumnWidths,
    minColumnWidth,
    COLUMN_CLASS_WIDTHS
  } from '../../composables/column-sizing.js'

  defineOptions({ name: 'VirtualEventTable' })

  /**
   * `VirtualEventTable` — virtualized event table owning its own `<table>` since
   * PrimeVue can't virtualize variable-height rows, while reusing webkit chrome.
   * Adds windowing (P1/req 1.1), ts sort, column resize and inline expansion.
   */
  const props = defineProps({
    data: { type: Array, default: () => [] },
    selectedFields: { type: Array, default: () => [] },
    expandedRows: { type: Array, default: () => [] },
    detailViewMode: { type: String, default: 'inline' },
    isLoading: { type: Boolean, default: false },
    isDetailLoading: { type: Boolean, default: false },
    // The authoritative CSV export command (parent's `useExportData.exportCsv`,
    // re-fetches the LOGICAL range ≤ EXPORT_MAX_ROWS). Kept on the public surface
    // for the parent binding; the table itself no longer routes export.
    exportCsv: { type: Function, default: undefined },
    rowClass: { type: Function, default: undefined },
    debouncedSearchQuery: { type: String, default: '' },
    dataset: { type: String, default: '' },
    highlightText: { type: Function, default: (value) => value },
    isRowActive: { type: Function, default: () => false },
    getFieldValue: { type: Function, required: true },
    // The SINGLE data-reset signal (design §2.1(4)/§12.2): the parent passes
    // `dataset.resetToken`, which bumps on a fresh/shorter set, and the window
    // consumes THAT. Defaults to 0 for unit callers that don't wire a token.
    resetToken: { type: Number, default: 0 }
  })

  const emit = defineEmits([
    'update:expandedRows',
    'row-click',
    'select-row',
    'add-filter',
    'exclude-filter',
    'notify'
  ])

  // ── Column widths (table-layout: fixed needs authoritative widths) ──────────
  // Chevron 2.5rem, Time 185px (fixed). Dynamic field columns are CONTENT-AWARE +
  // RESPONSIVE (column-sizing.js): value-heavy fields absorb the measured leftover
  // width (from the viewport RO), compact fields stay narrow; Document flexes to fill.
  const CHEVRON_WIDTH = '2.5rem'
  const TIME_WIDTH = 185
  const DOCUMENT_MIN_WIDTH = 400

  const hasDocumentColumn = computed(() => props.selectedFields.length === 0)

  // EXACT column count for spacer/expansion colspans. A hardcoded colspan=1000
  // made `table-layout: fixed` count 1000 columns: the ~998 phantom auto columns
  // split the width with Document (~1.7px each) → badges clipped invisible (the
  // fullscreen "Document blank" bug — column count is resolved at first layout).
  const columnCount = computed(
    () => 2 + props.selectedFields.length + (hasDocumentColumn.value ? 1 : 0)
  )

  // Per-field DRAG-RESIZED widths (px), keyed by field name — authoritative
  // overrides. Fields without an override get the responsive distribution.
  const fieldWidths = ref({})
  const timeWidth = ref(TIME_WIDTH)
  // Measured scroll-viewport inner width (clientWidth), fed by syncViewport().
  const viewportWidth = ref(0)

  const CHEVRON_WIDTH_PX = 40 // 2.5rem @ 16px root

  const distributedWidths = computed(() =>
    distributeColumnWidths({
      availableWidth: viewportWidth.value,
      fields: props.selectedFields,
      userWidths: fieldWidths.value,
      fixedLeadWidth: CHEVRON_WIDTH_PX + timeWidth.value
    })
  )

  const columnWidthOf = (fieldName) =>
    fieldWidths.value[fieldName] ||
    distributedWidths.value[fieldName] ||
    COLUMN_CLASS_WIDTHS.medium.base

  // Authoritative MIN width for the whole table. Under `table-layout: fixed` a
  // cell `min-width` is ignored, so Document would collapse to ~0 and clip (the
  // "Document column blank" bug). Pinning a table min-width h-scrolls a narrow
  // container instead; field mins are class-based (narrow 90/medium 140/wide 240).
  const tableMinWidth = computed(() => {
    const fieldsTotal = props.selectedFields.reduce(
      (sum, name) => sum + minColumnWidth(name, fieldWidths.value),
      0
    )
    const documentMin = hasDocumentColumn.value ? DOCUMENT_MIN_WIDTH : 0
    return CHEVRON_WIDTH_PX + timeWidth.value + fieldsTotal + documentMin
  })

  // ── Sort (3-state removable, numeric `ts`) ──────────────────────────────────
  // Mirrors PrimeVue `removableSort` on `sortField="ts"`: the Time header cycles
  // asc → desc → none. Applied to the LOGICAL rows BEFORE windowing, always on the
  // numeric `ts` key (not the display `tsFormat`).
  const sortOrder = ref(0) // 0 = none, 1 = asc, -1 = desc

  const toggleTimeSort = () => {
    sortOrder.value = sortOrder.value === 0 ? 1 : sortOrder.value === 1 ? -1 : 0
  }

  const logicalRows = computed(() => {
    const rows = props.data || []
    if (sortOrder.value === 0) return rows
    const direction = sortOrder.value
    return [...rows].sort((rowA, rowB) => {
      const av = Number(rowA?.ts) || 0
      const bv = Number(rowB?.ts) || 0
      return (av - bv) * direction
    })
  })

  // ── Expansion state (normalized to a Set<id> for O(1) lookup) ───────────────
  // The public contract keeps `expandedRows` as an array of row objects (drop-in,
  // design §12.3); internally we index by id so a recycled/reordered window never
  // misattributes the expanded band.
  const expandedIdSet = computed(() => {
    const set = new Set()
    for (const row of props.expandedRows || []) {
      if (row?.id != null) set.add(row.id)
    }
    return set
  })
  const isRowExpandedById = (row) => expandedIdSet.value.has(row?.id)

  // ── Own scroll viewport wiring for the windower ─────────────────────────────
  const scrollParentRef = ref(null)
  const scrollTop = ref(0)
  const viewportHeight = ref(0)

  // The window's reset signal is the SUM of two resets folded into one monotonic
  // token (design §2.1(4)/§12.2): (1) DATA reset — a fresh/shorter set, owned by
  // the dataset's `resetToken`; (2) SORT reset — a client-side reorder. Growth
  // must NOT reset.
  const dataResetToken = ref(0)
  watch(
    () => props.resetToken,
    (current, previous) => {
      // Mirror every dataset bump into the window's data-reset.
      if (current !== previous) dataResetToken.value += 1
    }
  )

  // Sorting re-orders the logical set: drop measured heights so re-materialized
  // rows re-measure against their new neighbours.
  const sortResetToken = ref(0)
  watch(sortOrder, () => {
    sortResetToken.value += 1
  })

  const windowResetToken = computed(() => dataResetToken.value + sortResetToken.value)

  const { windowedRows, topSpacer, bottomSpacer, measureRow, forceRemeasure } = useRowWindow({
    logicalRows,
    scrollTop,
    viewportHeight,
    keyOf: (row) => row?.id,
    expandedKey: (row) => props.detailViewMode === 'inline' && isRowExpandedById(row),
    resetToken: windowResetToken,
    onAnchorAdjust: (deltaPx) => {
      const el = scrollParentRef.value
      if (el && deltaPx) el.scrollTop = el.scrollTop + deltaPx
    }
  })

  // ── Overflow measure (single shared ResizeObserver for "+N more") ───────────
  const { hiddenCountFor, observeRow, unobserveRow } = useOverflowMeasure({
    scrollParentRef
  })

  // Bind a Document-column row's LogFieldBadges container to the single observer,
  // reading the child's exposed `containerEl` (C2 — no more inline querySelector).
  // Detach (unmount/recycle) unconditionally unobserves so toggling the Document
  // column off never strands detached badge DOM in the observer (fix L3).
  const bindBadgeContainer = (rowId, instance) => {
    if (!instance) {
      unobserveRow(rowId)
      return
    }
    if (!hasDocumentColumn.value) return
    observeRow(rowId, instance.containerEl ?? null)
  }

  // ── Viewport measurement (scroll + resize) ──────────────────────────────────
  let viewportObserver = null

  const syncViewport = () => {
    const el = scrollParentRef.value
    if (!el) return
    scrollTop.value = el.scrollTop
    viewportHeight.value = el.clientHeight
    // Inner width feeds the responsive column distribution (column-sizing.js);
    // the same ResizeObserver below re-syncs it on resolution/sidebar/fullscreen
    // changes. clientWidth already excludes the vertical scrollbar.
    viewportWidth.value = el.clientWidth
  }

  const onScroll = () => {
    const el = scrollParentRef.value
    if (el) scrollTop.value = el.scrollTop
  }

  const acquireViewportObserver = () => {
    const el = scrollParentRef.value
    if (!el) return
    // Idempotent: never stack observers when re-acquired (mount + watch + activate).
    releaseViewportObserver()
    syncViewport()
    if (typeof ResizeObserver !== 'undefined') {
      viewportObserver = new ResizeObserver(() => syncViewport())
      viewportObserver.observe(el)
    }
  }

  function releaseViewportObserver() {
    viewportObserver?.disconnect()
    viewportObserver = null
  }

  // The scroll viewport lives behind `v-else` of `v-if="isLoading"`, so it mounts
  // FRESH once isLoading flips false. Without re-acquiring against the new element
  // `viewportHeight` stays 0 → only overscan+1 rows mount (the "lazy-load
  // unreachable" bug). Re-acquire on element change; el→null just disconnects.
  watch(scrollParentRef, (el) => {
    if (el) nextTick(acquireViewportObserver)
    else releaseViewportObserver()
  })

  onMounted(() => {
    nextTick(acquireViewportObserver)
  })
  onActivated(() => {
    nextTick(acquireViewportObserver)
  })
  // Symmetric teardown on BOTH unmount and keep-alive deactivate (no leaks).
  onBeforeUnmount(releaseViewportObserver)
  onDeactivated(releaseViewportObserver)

  // ── Row height measurement (single shared RO on each mounted <tr>) ──────────
  const { setRowBaseEl, setRowExpansionEl, readAllRowHeights } = useRowHeightObserver({
    measureRow
  })

  // ── Stable per-row callbacks (C2) ───────────────────────────────────────────
  // Emit forwarders + ref factories are created ONCE per rowId (memoized in a
  // Map) so children (LogFieldBadges/EventDocumentView) and Vue's ref system see
  // a constant identity across re-renders — no tear-down/re-bind churn per frame.
  // Vue invokes a ref with null on unmount, so entries self-evict when the row
  // leaves the window.
  const forwardAddFilter = (field, value) => emit('add-filter', field, value)
  const forwardExcludeFilter = (field, value) => emit('exclude-filter', field, value)

  const memoRef = (cache, key, make) => {
    let fn = cache.get(key)
    if (!fn) {
      fn = make(key)
      cache.set(key, fn)
    }
    return fn
  }
  const baseRowRefs = new Map()
  const expansionRowRefs = new Map()
  const badgeRefs = new Map()

  const baseRowRef = (key) =>
    memoRef(baseRowRefs, key, (rowId) => {
      const bind = setRowBaseEl(rowId)
      return (el) => {
        bind(el)
        if (el === null) baseRowRefs.delete(rowId)
      }
    })
  const expansionRowRef = (key) =>
    memoRef(expansionRowRefs, key, (rowId) => {
      const bind = setRowExpansionEl(rowId)
      return (el) => {
        bind(el)
        if (el === null) expansionRowRefs.delete(rowId)
      }
    })
  const badgeContainerRef = (key) =>
    memoRef(badgeRefs, key, (rowId) => (instance) => {
      bindBadgeContainer(rowId, instance)
      if (instance === null) badgeRefs.delete(rowId)
    })

  // ── Column resize (mirror columnResizeMode="expand") ────────────────────────
  // On resize end drop measured heights so rows re-measure against the new column
  // widths (mirrors §12.2 forceRemeasure), then re-read every registered row.
  const { startResize } = useColumnResize({
    timeWidth,
    fieldWidths,
    columnWidthOf,
    onResizeEnd: () => {
      forceRemeasure()
      nextTick(() => readAllRowHeights())
    }
  })

  // ── Row interaction ─────────────────────────────────────────────────────────
  const onRowClick = (event, row) => {
    emit('row-click', { originalEvent: event, data: row, index: null })
  }

  const dynamicFieldKey = (fieldName) => `field_${fieldName}`

  // Hover-gate the per-field action buttons: mount the two PrimeButtons only for
  // the hovered cell (2×fields×rows always-mounted buttons otherwise). The
  // reserved-width wrapper keeps row heights stable on hover.
  const hoveredCellKey = ref(null)
</script>

<template>
  <div class="discover-table-scroll-area">
    <div
      v-if="isLoading"
      class="flex flex-col gap-2 p-4 w-full"
    >
      <Skeleton
        v-for="idx in 8"
        :key="idx"
        class="w-full h-10"
      />
    </div>
    <div
      v-else
      ref="scrollParentRef"
      class="virtual-table-viewport"
      @scroll="onScroll"
    >
      <div
        v-if="!logicalRows.length"
        class="virtual-table-empty"
      >
        <EmptyResultsBlock
          title="No logs found"
          description="Try adjusting your time range or filters."
          :noBorder="true"
        >
          <template #illustration>
            <i class="pi pi-search text-5xl text-color-secondary" />
          </template>
          <template #default><span /></template>
        </EmptyResultsBlock>
      </div>
      <table
        v-else
        class="virtual-event-table"
        :style="{ minWidth: `${tableMinWidth}px` }"
      >
        <thead class="virtual-table-thead">
          <tr>
            <th
              class="col-chevron"
              :style="{ width: CHEVRON_WIDTH, minWidth: CHEVRON_WIDTH, maxWidth: CHEVRON_WIDTH }"
            />
            <th
              class="col-time"
              :style="{ width: `${timeWidth}px` }"
              @click="toggleTimeSort"
            >
              <span class="th-content">
                <span>Time</span>
                <i
                  v-if="sortOrder !== 0"
                  :class="['pi', sortOrder === 1 ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down']"
                />
              </span>
              <span
                class="col-resizer"
                @click.stop
                @mousedown="startResize($event, 'time')"
              />
            </th>
            <th
              v-for="fieldName in selectedFields"
              :key="'th-' + fieldName"
              class="col-field"
              :style="{ width: `${columnWidthOf(fieldName)}px` }"
            >
              <span class="th-content">{{ fieldName }}</span>
              <span
                class="col-resizer"
                @click.stop
                @mousedown="startResize($event, fieldName)"
              />
            </th>
            <th
              v-if="hasDocumentColumn"
              class="col-document"
              :style="{ minWidth: `${DOCUMENT_MIN_WIDTH}px` }"
            >
              <span class="th-content">Document</span>
            </th>
          </tr>
        </thead>
        <tbody class="virtual-table-tbody">
          <tr
            v-if="topSpacer > 0"
            class="virtual-spacer-row"
            aria-hidden="true"
          >
            <td
              :colspan="columnCount"
              class="virtual-spacer-cell"
              :style="{ height: `${topSpacer}px` }"
            />
          </tr>
          <template
            v-for="item in windowedRows"
            :key="item.key"
          >
            <tr
              :ref="baseRowRef(item.key)"
              data-testid="table-body-row"
              :data-row-id="item.key"
              class="virtual-body-row"
              :class="rowClass ? rowClass(item.row) : undefined"
              @click="onRowClick($event, item.row)"
            >
              <td class="col-chevron">
                <i
                  :class="[
                    'pi pi-chevron-right expand-indicator',
                    { 'expand-indicator--active': isRowActive(item.row) }
                  ]"
                  @click.stop="emit('select-row', item.row)"
                />
              </td>
              <td class="col-time">
                <span
                  class="timestamp-cell"
                  @click.stop="emit('select-row', item.row)"
                  >{{ item.row.tsFormat }}</span
                >
              </td>
              <td
                v-for="fieldName in selectedFields"
                :key="'td-' + fieldName"
                class="col-field"
              >
                <span
                  class="dynamic-field-cell group/dyn"
                  @mouseenter="hoveredCellKey = item.key + ':' + fieldName"
                  @mouseleave="hoveredCellKey = null"
                >
                  <!-- Resolve the cell value ONCE per render (C2) via a 1-item
                       v-for local, reused by title/v-html and both emit handlers. -->
                  <template
                    v-for="cellValue in [getFieldValue(item.row, dynamicFieldKey(fieldName))]"
                    :key="cellValue"
                  >
                    <span
                      class="dynamic-field-value"
                      :title="cellValue"
                      v-html="highlightText(cellValue)"
                    />
                    <span class="dynamic-field-actions">
                      <template v-if="hoveredCellKey === item.key + ':' + fieldName">
                        <PrimeButton
                          icon="pi pi-filter"
                          text
                          size="small"
                          class="!w-5 !h-5 !p-0"
                          @click.stop="emit('add-filter', fieldName, cellValue)"
                        />
                        <PrimeButton
                          icon="pi pi-filter-slash"
                          text
                          size="small"
                          class="!w-5 !h-5 !p-0"
                          @click.stop="emit('exclude-filter', fieldName, cellValue)"
                        />
                      </template>
                    </span>
                  </template>
                </span>
              </td>
              <td
                v-if="hasDocumentColumn"
                class="col-document"
              >
                <LogFieldBadges
                  :ref="badgeContainerRef(item.key)"
                  :summary="item.row.summary"
                  :highlightFields="selectedFields"
                  :searchQuery="debouncedSearchQuery"
                  :dataset="dataset"
                  :hiddenCount="hiddenCountFor(item.key)"
                  @toggle-expand="emit('select-row', item.row)"
                  @add-filter="forwardAddFilter"
                  @exclude-filter="forwardExcludeFilter"
                />
              </td>
            </tr>
            <tr
              v-if="detailViewMode === 'inline' && isRowExpandedById(item.row)"
              :ref="expansionRowRef(item.key)"
              class="virtual-expansion-row"
              :data-row-expansion-id="item.key"
            >
              <td :colspan="columnCount">
                <div class="expansion-content">
                  <EventDocumentView
                    :data="item.row"
                    :isLoading="isDetailLoading"
                    :compact="true"
                    @add-filter="forwardAddFilter"
                    @exclude-filter="forwardExcludeFilter"
                    @notify="(payload) => emit('notify', payload)"
                  />
                </div>
              </td>
            </tr>
          </template>
          <tr
            v-if="bottomSpacer > 0"
            class="virtual-spacer-row"
            aria-hidden="true"
          >
            <td
              :colspan="columnCount"
              class="virtual-spacer-cell"
              :style="{ height: `${bottomSpacer}px` }"
            />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
  .discover-table-scroll-area {
    flex: 1;
    min-height: 0;
    min-width: 0;
    width: 100%;
    overflow: hidden;
  }

  /* ── Own scroll viewport (replaces PrimeVue .p-datatable-wrapper) ── */
  .virtual-table-viewport {
    width: 100%;
    height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .virtual-table-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* table-layout: fixed is REQUIRED for virtualization — the old `auto` only
     worked because every row was rendered. Widths are authoritative (via the
     column descriptors + per-column resize state). */
  .virtual-event-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }

  /* ── thead (sticky) ── */
  .virtual-table-thead > tr > th {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--text-color-secondary);
    background: var(--surface-ground);
    border-bottom: 2px solid var(--surface-border);
    position: sticky;
    top: 0;
    z-index: 1;
    white-space: nowrap;
    text-align: left;
    user-select: none;
    /* sticky establishes a containing block for the absolute .col-resizer */
    overflow: visible;
  }
  .virtual-table-thead .col-time {
    cursor: pointer;
  }
  .th-content {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .col-resizer {
    position: absolute;
    top: 0;
    right: 0;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    user-select: none;
  }
  .col-resizer:hover {
    background: var(--primary-color);
    opacity: 0.4;
  }

  /* ── tbody rows ── */
  .virtual-table-tbody > tr > td {
    padding: 0.6rem 0.75rem;
    vertical-align: top;
    border-bottom: 1px solid var(--surface-border);
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background-color 0.15s;
    background: var(--surface-card);
  }
  .virtual-body-row:nth-child(even) > td {
    background: var(--table-body-row-even-bg);
  }
  .virtual-body-row:hover > td {
    background: var(--table-body-row-hover-bg) !important;
    cursor: pointer;
  }
  .virtual-body-row.row--active > td {
    background: color-mix(in srgb, var(--primary-color) 6%, transparent) !important;
  }
  .virtual-body-row.row--active:hover > td {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent) !important;
  }
  .virtual-body-row.row--expanded > td {
    background: var(--surface-100) !important;
    border-bottom-color: transparent;
  }
  .virtual-body-row.row--focused > td {
    background: var(--surface-hover) !important;
  }
  .virtual-expansion-row > td {
    padding: 0;
    background: var(--surface-ground);
    border-bottom: 1px solid var(--surface-border);
  }

  /* Spacer rows: a single full-width <td> with only height (design §12.1) */
  .virtual-spacer-row > .virtual-spacer-cell {
    padding: 0;
    border: 0;
    line-height: 0;
    background: transparent;
  }

  /* First column (expand chevron): no ellipsis, no overflow */
  .virtual-table-tbody > tr > td.col-chevron {
    overflow: visible;
    text-overflow: clip;
    width: 2.5rem;
  }

  /* Force square (not circular) shape on icon-only text buttons in the table */
  :deep(.virtual-event-table .p-button.p-button-text.p-button-icon-only),
  :deep(.virtual-event-table .p-button.p-button-text) {
    border-radius: 4px !important;
  }

  /* ── Cell styles (reused verbatim from the old component) ── */
  .expand-indicator {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--border-radius);
    transition:
      color 0.15s,
      transform 0.2s,
      background-color 0.15s;
  }
  .expand-indicator:hover {
    color: var(--text-color);
    background: var(--surface-hover);
  }
  .expand-indicator--active {
    color: var(--primary-color);
    transform: rotate(90deg);
  }
  .timestamp-cell {
    font-family: var(--font-code), ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.72rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--border-radius);
    transition: background-color 0.15s;
    overflow: visible;
    text-overflow: unset;
    line-height: 20px;
  }
  .timestamp-cell:hover {
    background: var(--surface-hover);
    color: var(--text-color);
  }
  .dynamic-field-cell {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    position: relative;
    font-family: var(--font-code), ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.75rem;
  }
  .dynamic-field-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
  .dynamic-field-value :deep(.search-highlight),
  :deep(.search-highlight) {
    /* Vivid --warning-contrast fill + subtle --warning text: legible in both
       themes. The prior --warning fill (dark #312602) hid matches in dark. */
    background: var(--warning-contrast);
    color: var(--warning);
    border-radius: 2px;
    padding: 0 1px;
  }
  .dynamic-field-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    flex-shrink: 0;
    /* Reserve the two 20px buttons + 2px gap so the row doesn't shift on hover
       now that the buttons only mount on hover (v-if). */
    width: 42px;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.1s;
  }
  .dynamic-field-cell:hover .dynamic-field-actions {
    visibility: visible;
    opacity: 1;
  }
  .expansion-content {
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    border-left: 3px solid var(--series-one-color, #fba86f);
    background: var(--surface-ground);
    animation: expandIn 0.2s ease-out;
  }
  @keyframes expandIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
