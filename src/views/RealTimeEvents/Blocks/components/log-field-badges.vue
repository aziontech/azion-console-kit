<script setup>
  import { computed } from 'vue'
  import { getSeverity } from '../../composables/useSeverityClassifier'

  defineOptions({ name: 'LogFieldBadges' })

  const props = defineProps({
    summary: {
      type: Array,
      default: () => []
    },
    maxFields: {
      type: Number,
      default: 10
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

  const highlightSet = computed(() => new Set(props.highlightFields))

  const getBadgeSeverity = (item) => getSeverity(item.key, item.value)

  const visibleFields = computed(() => {
    // Show highlighted fields first, then the rest
    const highlighted = []
    const others = []

    props.summary.forEach((item) => {
      if (highlightSet.value.has(item.key)) {
        highlighted.push(item)
      } else {
        others.push(item)
      }
    })

    const all = [...highlighted, ...others]
    return all.slice(0, props.maxFields)
  })

  const hiddenCount = computed(() => {
    return Math.max(0, props.summary.length - props.maxFields)
  })

  const truncateValue = (value, maxLen = 80) => {
    if (!value || value === '-') return '-'
    const str = String(value)
    return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
  }

  const highlightMatch = (text) => {
    if (!props.searchQuery?.trim() || !text) return text
    const str = String(text)
    const needle = props.searchQuery.trim()
    const pos = str.toLowerCase().indexOf(needle.toLowerCase())
    if (pos === -1) return str
    return (
      str.slice(0, pos) +
      '<mark class="search-highlight">' +
      str.slice(pos, pos + needle.length) +
      '</mark>' +
      str.slice(pos + needle.length)
    )
  }
</script>

<template>
  <div class="log-badges-row">
    <div
      class="log-badges-container"
      @click="emit('toggle-expand')"
    >
      <span
        v-for="(item, index) in visibleFields"
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
          v-html="highlightMatch(truncateValue(item.value))"
        />
        <span class="log-badge__actions">
          <i
            class="pi pi-filter log-badge__action-icon log-badge__action-icon--filter"
            @click.stop="emit('add-filter', item.key, item.value)"
            title="Filter for value"
          />
          <i
            class="pi pi-filter-slash log-badge__action-icon log-badge__action-icon--exclude"
            @click.stop="emit('exclude-filter', item.key, item.value)"
            title="Exclude value"
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
    display: flex;
    align-items: flex-start;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .log-badges-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    cursor: pointer;
    padding: 2px 0;
    max-width: 100%;
    max-height: 44px;
    overflow: hidden;
  }

  .log-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 0.72rem;
    line-height: 1.4;
    font-family: ui-monospace, var(--text-body-xss), 'SF Mono', Menlo, Consolas, monospace;
    background: var(--surface-100);
    border: 1px solid var(--surface-200);
    max-width: 100%;
    position: relative;
    flex-shrink: 0;
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
    font-style: italic;
    border-style: dashed;
    cursor: pointer;
  }

  /* ── Badge parts ──────────────────────────────────────────────── */
  .log-badge__key {
    color: #f5f5f5;
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
    max-width: 180px;
    border-radius: 2px;
  }

  /* ── Inline hover action icons ──────────────────────────────── */
  .log-badge__actions {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    margin-left: 2px;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .log-badge:hover .log-badge__actions {
    visibility: visible;
    opacity: 1;
  }

  .log-badge__action-icon {
    font-size: 0.6rem;
    padding: 2px;
    border-radius: var(--border-radius);
    cursor: pointer;
    color: var(--text-color-secondary);
    transition:
      color 0.1s ease,
      background-color 0.1s ease;
  }

  .log-badge__action-icon:hover {
    background: var(--surface-hover);
  }

  .log-badge__action-icon--filter:hover {
    color: var(--primary-color);
  }

  .log-badge__action-icon--exclude:hover {
    color: var(--red-400, #f87171);
  }

  :deep(.search-highlight) {
    background: var(--yellow-500, #eab308);
    color: var(--surface-ground);
    border-radius: 2px;
    padding: 0 1px;
  }
</style>
