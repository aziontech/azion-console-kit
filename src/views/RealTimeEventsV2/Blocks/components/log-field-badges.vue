<script setup>
  import { computed, ref } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { getSeverity } from '../../composables/utils/severity-classifier'
  import { useClickToFilter } from '../../composables/useClickToFilter.js'
  import { highlightMatch } from '../../composables/utils/highlight-match'

  defineOptions({ name: 'LogFieldBadges' })

  const props = defineProps({
    summary: {
      type: Array,
      default: () => []
    },
    highlightFields: {
      type: Array,
      default: () => []
    },
    searchQuery: {
      type: String,
      default: ''
    },
    dataset: {
      type: String,
      default: ''
    },
    // Overflow count driven by the single per-table ResizeObserver in
    // useOverflowMeasure (task 3.3). This component is purely presentational:
    // it renders "+N more" from this prop and no longer owns a ResizeObserver.
    hiddenCount: {
      type: Number,
      default: 0
    }
  })

  const emit = defineEmits(['toggle-expand', 'add-filter', 'exclude-filter'])

  const { onValueMouseDown, onValueMouseUp, onValueClick } = useClickToFilter({
    onAdd: (key, value) => emit('add-filter', key, value),
    onExclude: (key, value) => emit('exclude-filter', key, value)
  })

  const highlightSet = computed(() => new Set(props.highlightFields))

  // Task 15.1 hardening — make a wrong/undefined `summary` binding OBSERVABLE
  // instead of a silent blank Document cell. Coerce non-arrays to `[]` (never
  // throw on `.forEach`) AND warn in dev so passing the row wrapper instead of
  // `item.row.summary` surfaces at the seam that produced it.
  const normalizedSummary = computed(() => {
    const value = props.summary
    if (Array.isArray(value)) return value
    if (value != null && import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        '[LogFieldBadges] `summary` must be an Array of { key, value } entries; ' + 'received',
        value,
        '— the Document column will render empty. Check the binding (e.g. pass ' +
          '`item.row.summary`, not the row wrapper).'
      )
    }
    return []
  })

  const getBadgeSeverity = (item) => getSeverity(item.key, item.value)

  const truncateValue = (value, maxLen = 80) => {
    if (!value || value === '-') return '-'
    const str = String(value)
    return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
  }

  // Precompute the rendered rows ONCE per input change (summary / highlight /
  // searchQuery), not per re-render. Each badge carries its pre-escaped
  // highlighted HTML so the template's v-html never re-runs highlightMatch on
  // unrelated re-renders. Highlighted fields sort first.
  const badges = computed(() => {
    const needle = props.searchQuery?.trim() || ''
    const highlighted = []
    const others = []
    normalizedSummary.value.forEach((item) => {
      const severity = getBadgeSeverity(item)
      const badge = {
        key: item.key,
        value: item.value,
        title: String(item.value),
        severity,
        isHighlighted: highlightSet.value.has(item.key),
        // eslint-disable-next-line xss/no-mixed-html -- highlightMatch HTML-escapes every text segment; only fixed <mark> markup is literal
        valueHtml: highlightMatch(truncateValue(item.value), needle)
      }
      if (badge.isHighlighted) highlighted.push(badge)
      else others.push(badge)
    })
    return [...highlighted, ...others]
  })

  const hoveredIndex = ref(-1)

  // Expose the badge container el (C2): the table's single overflow observer
  // binds it directly, replacing the parent's querySelector-based lookup.
  const containerRef = ref(null)
  defineExpose({ containerEl: containerRef })
</script>

<template>
  <div class="log-badges-row">
    <div
      ref="containerRef"
      class="log-badges-container"
      role="button"
      tabindex="0"
      aria-label="Expand event details"
      @click="emit('toggle-expand')"
      @keydown.enter.prevent="emit('toggle-expand')"
      @keydown.space.prevent="emit('toggle-expand')"
    >
      <span
        v-for="(item, index) in badges"
        :key="item.key"
        v-memo="[item, hoveredIndex === index]"
        class="log-badge"
        :class="{
          'log-badge--highlighted': item.isHighlighted,
          [`log-badge--${item.severity}`]: item.severity
        }"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = -1"
      >
        <span class="log-badge__key">{{ item.key }}</span>
        <span class="log-badge__separator">:</span>
        <span
          class="log-badge__value"
          :title="item.title"
          role="button"
          tabindex="0"
          :aria-label="`Filter for ${item.key}`"
          @mousedown="onValueMouseDown"
          @mouseup="onValueMouseUp"
          @click.stop="(e) => onValueClick(e, item.key, item.value)"
          @keydown.enter.stop.prevent="(e) => onValueClick(e, item.key, item.value)"
          @keydown.space.stop.prevent="(e) => onValueClick(e, item.key, item.value)"
          v-html="item.valueHtml"
        />
        <span class="log-badge__actions">
          <template v-if="hoveredIndex === index">
            <PrimeButton
              icon="pi pi-filter"
              text
              size="small"
              class="log-badge__action-btn log-badge__action-btn--filter"
              aria-label="Filter for value"
              @click.stop="emit('add-filter', item.key, item.value)"
            />
            <PrimeButton
              icon="pi pi-filter-slash"
              text
              size="small"
              class="log-badge__action-btn log-badge__action-btn--exclude"
              aria-label="Filter out value"
              @click.stop="emit('exclude-filter', item.key, item.value)"
            />
          </template>
        </span>
      </span>

      <span
        v-if="hiddenCount > 0"
        class="log-badge log-badge--more"
        role="button"
        tabindex="0"
        :aria-label="`Show ${hiddenCount} more fields`"
        @click.stop="emit('toggle-expand')"
        @keydown.enter.stop.prevent="emit('toggle-expand')"
        @keydown.space.stop.prevent="emit('toggle-expand')"
      >
        +{{ hiddenCount }} more
      </span>
    </div>
  </div>
</template>

<style scoped>
  .log-badges-row {
    display: flex;
    align-items: flex-start;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .log-badges-container {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    gap: 5px 6px;
    cursor: pointer;
    padding: 0;
    /* Fill the (fixed-layout) Document column width so badges wrap within it.
       Without an explicit width a flex child shrink-to-fits, which under
       table-layout:fixed collapses the wrap and hides the badges. */
    width: 100%;
    min-width: 0;
    max-width: 100%;
    /* 2 rows: badge 20px × 2 + row-gap 5px = 45px */
    max-height: 45px;
    overflow: hidden;
  }

  .log-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 0 6px;
    border-radius: 3px;
    font-size: 0.72rem;
    line-height: 1;
    height: 20px;
    font-family: var(--font-code), ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--surface-100);
    border: 1px solid var(--surface-200);
    max-width: 100%;
    position: relative;
    flex-shrink: 0;
    user-select: text;
    transition:
      background-color 0.12s ease,
      border-color 0.12s ease;
  }

  .log-badge:hover {
    background: var(--surface-200);
  }

  /* ── Highlighted badges (selected as column) ──────────────────── */
  .log-badge--highlighted {
    background: color-mix(in srgb, var(--orange-500) 12%, transparent);
    border-color: color-mix(in srgb, var(--orange-500) 30%, transparent);
  }

  .log-badge--highlighted:hover {
    background: color-mix(in srgb, var(--orange-500) 20%, transparent);
  }

  /* ── Severity color badges ────────────────────────────────────── */
  .log-badge--error {
    background: color-mix(in srgb, var(--danger) 10%, transparent);
    border-color: color-mix(in srgb, var(--danger) 30%, transparent);
  }

  .log-badge--error .log-badge__value {
    /* --danger is the subtle FILL token (dark #5B0B0B in dark theme); the
       legible foreground is --danger-contrast (#ED7878 dark / #891010 light).
       Using the fill as text color made 5xx values invisible on --surface-100. */
    color: var(--danger-contrast);
    font-weight: 600;
  }

  .log-badge--error:hover {
    background: color-mix(in srgb, var(--danger) 18%, transparent);
  }

  .log-badge--warn {
    background: color-mix(in srgb, var(--warning) 10%, transparent);
    border-color: color-mix(in srgb, var(--warning) 25%, transparent);
  }

  .log-badge--warn .log-badge__value {
    /* --warning is the subtle FILL token (dark #312602); the legible
       foreground is --warning-contrast (#F7BD08 dark / #634B03 light).
       This is why `status: 400` was unreadable in the dark theme. */
    color: var(--warning-contrast);
    font-weight: 600;
  }

  .log-badge--warn:hover {
    background: color-mix(in srgb, var(--warning) 18%, transparent);
  }

  /* ── More badge ───────────────────────────────────────────────── */
  .log-badge--more {
    color: var(--text-color-secondary);
    font-weight: 600;
    border-style: dashed;
    cursor: pointer;
    background: var(--surface-ground);
  }

  .log-badge--more:hover {
    background: var(--surface-200);
    color: var(--primary-color);
    border-color: var(--primary-color);
  }

  /* ── Badge parts ──────────────────────────────────────────────── */
  .log-badge__key {
    color: var(--text-color);
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .log-badge__separator {
    color: var(--text-color-secondary);
    flex-shrink: 0;
  }

  .log-badge__value {
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 140px;
    border-radius: 2px;
    user-select: text;
    cursor: text;
  }

  .log-badges-container:focus-visible,
  .log-badge__value:focus-visible,
  .log-badge--more:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
  }

  /* ── Inline hover action buttons ──────────────────────────────── */
  .log-badge__actions {
    display: inline-flex;
    align-items: center;
    gap: 0;
    margin-left: 2px;
    flex-shrink: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s ease;
    /* Reserve fixed width so badges don't shift on hover */
    width: 32px;
    justify-content: flex-end;
  }

  .log-badge:hover .log-badge__actions {
    opacity: 1;
    pointer-events: auto;
  }

  :deep(.log-badge__action-btn.p-button) {
    width: 16px !important;
    height: 16px !important;
    min-width: 16px !important;
    max-width: 16px !important;
    padding: 0 !important;
    border-radius: 3px !important;
  }

  :deep(.log-badge__action-btn.p-button .p-button-icon) {
    font-size: 0.6rem !important;
  }

  :deep(.log-badge__action-btn--filter:hover) {
    color: var(--primary-color) !important;
  }

  :deep(.log-badge__action-btn--exclude:hover) {
    color: var(--danger-contrast) !important;
  }

  :deep(.search-highlight) {
    /* Invert the warning trio: vivid --warning-contrast as the mark fill,
       subtle --warning as the text. Legible in both themes; the previous
       --warning fill (dark #312602) made the highlight invisible in dark. */
    background: var(--warning-contrast);
    color: var(--warning);
    border-radius: 2px;
    padding: 0 1px;
  }
</style>
