<script setup>
  /**
   * DivergenceIndicator — warns that the Metrics chart may not reflect every
   * filter applied to the Events list.
   *
   * The Metrics chart is built from the subset of AQL filter fields that the
   * active Metrics dataset can express (supported-or-drop). When at least one
   * events-applicable field is dropped, the chart and the list can diverge.
   * This prop-driven, stateless indicator surfaces that divergence.
   *
   * Rendering is fully owned by the parent: it should pass `visible=true` only
   * when a Metrics view is active AND the load reported `partial`. When either
   * condition is false the component renders nothing.
   *
   * @prop {boolean} visible — show the indicator (metrics view active + partial).
   */
  defineProps({
    visible: { type: Boolean, default: false }
  })

  // Kept in a const so the copy has a single source of truth shared between the
  // tooltip, the accessible label, and the (visually hidden) description.
  const MESSAGE = 'The chart (Metrics) may not reflect every filter applied to the events list.'
</script>

<template>
  <span
    v-if="visible"
    class="divergence-indicator"
    tabindex="0"
    role="img"
    :aria-label="MESSAGE"
    data-testid="chart-divergence-indicator"
    v-tooltip.top="{ value: MESSAGE, showDelay: 200 }"
  >
    <i
      class="pi pi-exclamation-triangle divergence-indicator__icon"
      aria-hidden="true"
    />
  </span>
</template>

<style scoped>
  .divergence-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--shape-elements, 4px);
    cursor: help;
    color: var(--warning-border);
    outline: none;
  }

  .divergence-indicator:focus-visible {
    box-shadow: 0 0 0 2px var(--warning-border);
  }

  .divergence-indicator__icon {
    font-size: 0.75rem;
    line-height: 1;
  }
</style>
