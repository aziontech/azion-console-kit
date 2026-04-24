<script setup>
  /**
   * EventsSummaryBar — Discover-style KPI strip.
   *
   * Consumes the resolved KPI payload returned by the same GraphQL
   * aggregation call that powers the histogram — no sampling, no extra
   * round-trip. Shape:
   *   { total, clientErrors, serverErrors, avgRequestTime,
   *     supportsStatusBreakdown, supportsRequestTime }
   */
  import { computed, ref, watch } from 'vue'

  defineOptions({ name: 'EventsSummaryBar' })

  const props = defineProps({
    kpis: {
      type: Object,
      default: null
    }
  })

  const STORAGE_KEY = 'rte:summary-collapsed'

  const collapsed = ref(false)
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === '1') collapsed.value = true
  } catch {
    // localStorage unavailable; keep default
  }

  watch(collapsed, (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    } catch {
      // ignore
    }
  })

  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
  }

  const view = computed(() => {
    const kpisPayload = props.kpis || {}
    const total = Number(kpisPayload.total) || 0
    const clientErrors = kpisPayload.supportsStatusBreakdown
      ? Number(kpisPayload.clientErrors) || 0
      : 0
    const serverErrors = kpisPayload.supportsStatusBreakdown
      ? Number(kpisPayload.serverErrors) || 0
      : 0
    const pct = (count) => (total > 0 ? (count / total) * 100 : 0)
    return {
      total,
      clientErrors,
      serverErrors,
      clientPct: pct(clientErrors),
      serverPct: pct(serverErrors),
      avgRequestTime: kpisPayload.supportsRequestTime
        ? Number(kpisPayload.avgRequestTime) || 0
        : null,
      hasStatusBreakdown: !!kpisPayload.supportsStatusBreakdown,
      hasRequestTime: !!kpisPayload.supportsRequestTime
    }
  })

  const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value)
  const formatSeconds = (value) => `${value.toFixed(3)}s`
  // Renders a share as "X.X%" with sensible handling of sub-0.1% values so a
  // non-zero error count never reads as "0.0%".
  const formatPct = (percentage) => {
    if (!Number.isFinite(percentage) || percentage <= 0) return '0% of total'
    if (percentage < 0.1) return '<0.1% of total'
    if (percentage < 10) return `${percentage.toFixed(2)}% of total`
    return `${percentage.toFixed(1)}% of total`
  }
</script>

<template>
  <div
    class="events-summary-bar"
    :class="{ 'events-summary-bar--collapsed': collapsed }"
    data-testid="events-summary-bar"
  >
    <!-- Header row (always visible) -->
    <button
      type="button"
      class="events-summary-bar__header"
      :aria-expanded="!collapsed"
      @click="toggleCollapsed"
      data-testid="events-summary-bar-toggle"
    >
      <i
        class="pi"
        :class="collapsed ? 'pi-chevron-right' : 'pi-chevron-down'"
      />
      <span class="events-summary-bar__title">SUMMARY</span>

      <!-- Inline condensed values when collapsed -->
      <div
        v-if="collapsed"
        class="events-summary-bar__inline"
      >
        <span
          v-if="view.hasRequestTime"
          class="events-summary-bar__inline-item"
        >
          avg
          <span class="events-summary-bar__inline-value">
            {{ formatSeconds(view.avgRequestTime) }}
          </span>
        </span>
        <span
          v-if="view.hasStatusBreakdown"
          class="events-summary-bar__inline-item"
        >
          4xx
          <span
            class="events-summary-bar__inline-value"
            :style="{ color: 'var(--yellow-400, #FACC15)' }"
          >
            {{ formatNumber(view.clientErrors) }}
          </span>
        </span>
        <span
          v-if="view.hasStatusBreakdown"
          class="events-summary-bar__inline-item"
        >
          5xx
          <span
            class="events-summary-bar__inline-value"
            :style="{ color: 'var(--red-400, #F87171)' }"
          >
            {{ formatNumber(view.serverErrors) }}
          </span>
        </span>
      </div>
    </button>

    <!-- Expanded grid -->
    <div
      v-if="!collapsed"
      class="events-summary-bar__grid"
      data-testid="events-summary-bar-grid"
    >
      <div class="events-summary-bar__card">
        <span class="events-summary-bar__label">AVG REQUEST TIME</span>
        <template v-if="view.hasRequestTime">
          <span class="events-summary-bar__value">{{ formatSeconds(view.avgRequestTime) }}</span>
          <span class="events-summary-bar__sub">across the full range</span>
        </template>
        <template v-else>
          <span class="events-summary-bar__value events-summary-bar__value--muted">—</span>
          <span class="events-summary-bar__sub">Not available for this dataset</span>
        </template>
      </div>
      <div class="events-summary-bar__card">
        <span class="events-summary-bar__label">CLIENT ERRORS (4XX)</span>
        <template v-if="view.hasStatusBreakdown">
          <span
            class="events-summary-bar__value"
            :style="{ color: 'var(--yellow-400, #FACC15)' }"
          >
            {{ formatNumber(view.clientErrors) }}
          </span>
          <span class="events-summary-bar__sub">{{ formatPct(view.clientPct) }}</span>
        </template>
        <template v-else>
          <span class="events-summary-bar__value events-summary-bar__value--muted">—</span>
          <span class="events-summary-bar__sub">Not available for this dataset</span>
        </template>
      </div>
      <div class="events-summary-bar__card">
        <span class="events-summary-bar__label">SERVER ERRORS (5XX)</span>
        <template v-if="view.hasStatusBreakdown">
          <span
            class="events-summary-bar__value"
            :style="{ color: 'var(--red-400, #F87171)' }"
          >
            {{ formatNumber(view.serverErrors) }}
          </span>
          <span class="events-summary-bar__sub">{{ formatPct(view.serverPct) }}</span>
        </template>
        <template v-else>
          <span class="events-summary-bar__value events-summary-bar__value--muted">—</span>
          <span class="events-summary-bar__sub">Not available for this dataset</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .events-summary-bar {
    border-top: 1px solid var(--surface-border);
    padding: 8px 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .events-summary-bar--collapsed {
    padding: 6px 12px;
  }

  .events-summary-bar__header {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--text-color-secondary);
    text-align: left;
  }

  .events-summary-bar__header > i {
    font-size: 10px;
  }

  .events-summary-bar__title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--text-color-secondary);
    text-transform: uppercase;
  }

  .events-summary-bar__inline {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    margin-left: 6px;
  }

  .events-summary-bar__inline-item {
    font-size: 11px;
    color: var(--text-color-secondary);
    display: inline-flex;
    gap: 4px;
    align-items: baseline;
  }

  .events-summary-bar__inline-value {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-weight: 600;
    color: var(--text-color);
  }

  .events-summary-bar__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .events-summary-bar__card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .events-summary-bar__label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-color-secondary);
  }

  .events-summary-bar__value {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 22px;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1.1;
  }

  .events-summary-bar__value--muted {
    color: var(--text-color-secondary);
    opacity: 0.55;
  }

  .events-summary-bar__sub {
    font-size: 11px;
    color: var(--text-color-secondary);
  }

  @media (max-width: 960px) {
    .events-summary-bar__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .events-summary-bar__grid {
      grid-template-columns: 1fr;
    }

    .events-summary-bar__value {
      font-size: 18px;
    }

    .events-summary-bar__inline {
      gap: 8px;
      flex-wrap: wrap;
    }
  }
</style>
