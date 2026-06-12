<script setup>
  import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { getSeverity } from '../../composables/useSeverityClassifier'
  import { useClickToFilter } from '../../composables/useClickToFilter.js'

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
    }
  })

  const emit = defineEmits(['toggle-expand', 'add-filter', 'exclude-filter'])

  const { onValueMouseDown, onValueMouseUp, onValueClick } = useClickToFilter({
    onAdd: (key, value) => emit('add-filter', key, value),
    onExclude: (key, value) => emit('exclude-filter', key, value)
  })

  const highlightSet = computed(() => new Set(props.highlightFields))

  const getBadgeSeverity = (item) => getSeverity(item.key, item.value)

  // Render every field. CSS clips what doesn't fit the visible band; the
  // ResizeObserver below measures how many badges actually overflow and
  // drives an accurate "+N more" badge — no hard-coded maxFields needed.
  const orderedFields = computed(() => {
    const highlighted = []
    const others = []
    props.summary.forEach((item) => {
      if (highlightSet.value.has(item.key)) highlighted.push(item)
      else others.push(item)
    })
    return [...highlighted, ...others]
  })

  const containerRef = ref(null)
  const hiddenCount = ref(0)
  let resizeObserver = null
  let measureRaf = 0

  const scheduleMeasure = () => {
    if (measureRaf) cancelAnimationFrame(measureRaf)
    measureRaf = requestAnimationFrame(measure)
  }

  const measure = () => {
    measureRaf = 0
    const container = containerRef.value
    if (!container) return
    const containerBottom = container.getBoundingClientRect().bottom
    let hidden = 0
    // Iterate badges (skip the trailing "+N more" badge itself).
    container.querySelectorAll('.log-badge:not(.log-badge--more)').forEach((badge) => {
      const rect = badge.getBoundingClientRect()
      // A badge counts as hidden when its bottom edge falls past the
      // container's clipped bottom — i.e. it sits on a row that overflow:
      // hidden cuts off.
      if (rect.bottom > containerBottom + 0.5) hidden += 1
    })
    if (hidden !== hiddenCount.value) hiddenCount.value = hidden
  }

  onMounted(() => {
    if (!containerRef.value) return
    resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(containerRef.value)
    nextTick(measure)
  })

  onBeforeUnmount(() => {
    if (measureRaf) cancelAnimationFrame(measureRaf)
    resizeObserver?.disconnect()
  })

  watch(orderedFields, () => nextTick(measure))

  const truncateValue = (value, maxLen = 80) => {
    if (!value || value === '-') return '-'
    const str = String(value)
    return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
  }

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  // Returns HTML wrapping the matched substring in <mark>. The badge value is
  // untrusted log data, so every text segment is HTML-escaped before it is
  // concatenated with the fixed <mark> markup; only safe markup reaches v-html.
  const highlightMatch = (text) => {
    if (!props.searchQuery?.trim() || !text) return escapeHtml(text ?? '')
    const str = String(text)
    const needle = props.searchQuery.trim()
    const pos = str.toLowerCase().indexOf(needle.toLowerCase())
    if (pos === -1) return escapeHtml(str)
    /* eslint-disable xss/no-mixed-html -- every text segment is HTML-escaped above; only fixed <mark> markup is literal */
    return (
      escapeHtml(str.slice(0, pos)) +
      '<mark class="search-highlight">' +
      escapeHtml(str.slice(pos, pos + needle.length)) +
      '</mark>' +
      escapeHtml(str.slice(pos + needle.length))
    )
    /* eslint-enable xss/no-mixed-html */
  }
</script>

<template>
  <div class="log-badges-row">
    <div
      ref="containerRef"
      class="log-badges-container"
      @click="emit('toggle-expand')"
    >
      <span
        v-for="(item, index) in orderedFields"
        :key="index"
        class="log-badge"
        :class="{
          'log-badge--highlighted': highlightSet.has(item.key),
          [`log-badge--${getBadgeSeverity(item)}`]: getBadgeSeverity(item)
        }"
      >
        <span class="log-badge__key">{{ item.key }}</span>
        <span class="log-badge__separator">:</span>
        <span
          class="log-badge__value"
          :title="String(item.value)"
          @mousedown="onValueMouseDown"
          @mouseup="onValueMouseUp"
          @click.stop="(e) => onValueClick(e, item.key, item.value)"
          v-html="highlightMatch(truncateValue(item.value))"
        />
        <span class="log-badge__actions">
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
        </span>
      </span>

      <span
        v-if="hiddenCount > 0"
        class="log-badge log-badge--more"
        @click.stop="emit('toggle-expand')"
      >
        +{{ hiddenCount }} more
      </span>
    </div>
  </div>
</template>

<style scoped>
  .log-badges-row {
    --rte-font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;

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
    font-family: ui-monospace, var(--text-body-xss), 'SF Mono', Menlo, Consolas, monospace;
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
    background: color-mix(in srgb, var(--red-400, #f87171) 10%, transparent);
    border-color: color-mix(in srgb, var(--red-400, #f87171) 30%, transparent);
  }

  .log-badge--error .log-badge__value {
    color: var(--red-400, #f87171);
    font-weight: 600;
  }

  .log-badge--error:hover {
    background: color-mix(in srgb, var(--red-400, #f87171) 18%, transparent);
  }

  .log-badge--warn {
    background: color-mix(in srgb, var(--yellow-500, #eab308) 10%, transparent);
    border-color: color-mix(in srgb, var(--yellow-500, #eab308) 25%, transparent);
  }

  .log-badge--warn .log-badge__value {
    color: var(--yellow-500, #eab308);
    font-weight: 600;
  }

  .log-badge--warn:hover {
    background: color-mix(in srgb, var(--yellow-500, #eab308) 18%, transparent);
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
    color: var(--red-400, #f87171) !important;
  }

  :deep(.search-highlight) {
    background: var(--yellow-500, #eab308);
    color: var(--surface-ground);
    border-radius: 2px;
    padding: 0 1px;
  }
</style>
