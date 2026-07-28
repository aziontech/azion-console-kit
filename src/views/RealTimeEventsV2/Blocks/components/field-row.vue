<script setup>
  import Checkbox from '@aziontech/webkit/checkbox'
  import ProgressBar from '@aziontech/webkit/progressbar'

  defineOptions({ name: 'FieldRow' })

  // Presentational field row shared by the sidebar's Pinned and Available
  // sections. Owns no derived state; parent supplies field/selected/expanded/
  // stats and reacts to toggle-select / toggle-stats / add-filter.
  const props = defineProps({
    field: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    },
    expanded: {
      type: Boolean,
      default: false
    },
    stats: {
      type: Object,
      default: null
    },
    testid: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['toggle-select', 'toggle-stats', 'add-filter'])

  const truncateFieldValue = (value, maxLen = 30) => {
    if (!value) return '-'
    return value.length > maxLen ? `${value.slice(0, maxLen)}…` : value
  }

  const onAddFilter = (value) => {
    emit('add-filter', props.field.value, value)
  }
</script>

<template>
  <div class="flex flex-col">
    <div
      class="field-sidebar__row"
      @click="emit('toggle-stats')"
      :data-testid="testid"
    >
      <Checkbox
        :modelValue="selected"
        :binary="true"
        class="!w-4 !h-4 flex-shrink-0"
        @click.stop="emit('toggle-select')"
      />
      <span
        class="field-sidebar__row-name"
        :class="{ 'field-sidebar__row-name--selected': selected }"
      >
        {{ field.value }}
      </span>
      <span
        v-if="stats"
        class="field-sidebar__row-count"
        v-tooltip.top="{
          value: `${stats.uniqueCount} unique values in loaded page`,
          showDelay: 300
        }"
      >
        {{ stats.uniqueCount }}
      </span>
    </div>

    <div
      v-if="expanded && stats"
      class="field-sidebar__stats"
    >
      <div class="field-sidebar__stats-title">
        Top {{ stats.topValues.length }} of {{ stats.uniqueCount }} values
      </div>
      <div
        v-for="(stat, statIdx) in stats.topValues"
        :key="statIdx"
        class="field-sidebar__topvalue-row"
        :title="stat.value"
        @click="onAddFilter(stat.value)"
      >
        <div class="field-sidebar__topvalue-meta">
          <span class="field-sidebar__topvalue-label">{{ truncateFieldValue(stat.value) }}</span>
          <span class="field-sidebar__topvalue-pct">{{ stat.percent }}%</span>
        </div>
        <ProgressBar
          :value="stat.percent"
          :showValue="false"
          class="!h-1"
        />
      </div>
      <div class="field-sidebar__topvalue-hint">Click a value to add as filter</div>
    </div>
  </div>
</template>

<style scoped>
  /* ── Field row ───────────────────────────────────────────────────── */
  .field-sidebar__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3125rem 0.75rem;
    min-height: 2rem;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .field-sidebar__row:hover {
    background: var(--surface-hover);
  }

  .field-sidebar__row-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    color: var(--text-color);
  }

  .field-sidebar__row-name--selected {
    font-weight: 600;
  }

  .field-sidebar__row-count {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
    min-width: 1.5rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Stats panel ─────────────────────────────────────────────────── */
  .field-sidebar__stats {
    margin: 0 0.75rem 0.375rem 1.75rem;
    padding: 0.5rem 0.625rem;
    border-radius: var(--border-radius);
    background: var(--surface-hover);
  }

  .field-sidebar__stats-title {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.375rem;
  }

  .field-sidebar__topvalue-row {
    display: flex;
    flex-direction: column;
    gap: 0.1875rem;
    padding: 0.25rem 0.375rem;
    border-radius: calc(var(--border-radius) - 2px);
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .field-sidebar__topvalue-row:hover {
    background: var(--surface-card);
  }

  .field-sidebar__topvalue-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.25rem;
  }

  .field-sidebar__topvalue-label {
    font-size: 0.75rem;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .field-sidebar__topvalue-pct {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .field-sidebar__topvalue-hint {
    font-size: 0.625rem;
    color: var(--text-color-secondary);
    font-style: italic;
    margin-top: 0.375rem;
    padding: 0 0.375rem;
    opacity: 0.75;
  }

  /* ── Responsive ──────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .field-sidebar__row {
      padding: 0.25rem 0.625rem;
      min-height: 1.75rem;
    }

    .field-sidebar__stats {
      margin: 0 0.625rem 0.25rem 1.5rem;
    }
  }

  @media (min-width: 1920px) {
    .field-sidebar__row {
      padding: 0.375rem 1rem;
      min-height: 2.25rem;
    }

    .field-sidebar__stats {
      margin: 0 1rem 0.5rem 2rem;
    }
  }
</style>
