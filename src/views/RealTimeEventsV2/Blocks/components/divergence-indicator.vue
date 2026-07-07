<script setup>
  import { ref, onBeforeUnmount, onDeactivated } from 'vue'

  /**
   * DivergenceIndicator — icon + self-owned popover explaining a chart/list
   * divergence. The tip teleports to <body> with fixed coords so no ancestor
   * stacking context (container-type) or overflow can trap it; Vue scoped CSS
   * follows teleported nodes, so styling stays deterministic.
   */
  const props = defineProps({
    visible: { type: Boolean, default: false },
    // Default copy = the original Metrics-filter divergence; callers with a
    // different divergence (e.g. aggregate-vs-raw retention) pass their own.
    message: {
      type: String,
      default: 'The chart (Metrics) may not reflect every filter applied to the events list.'
    },
    // 'warning' (amber triangle) or 'info' (muted circle).
    variant: {
      type: String,
      default: 'warning',
      validator: (value) => ['warning', 'info'].includes(value)
    },
    // Which side of the icon the tip opens on.
    side: {
      type: String,
      default: 'top',
      validator: (value) => ['top', 'bottom'].includes(value)
    }
  })

  const TIP_MAX_WIDTH_PX = 336
  const EDGE_GAP_PX = 8

  const rootEl = ref(null)
  const open = ref(false)
  const tipStyle = ref({})

  const closeTip = () => {
    open.value = false
    window.removeEventListener('scroll', closeTip, true)
    window.removeEventListener('resize', closeTip)
  }

  const openTip = () => {
    const rect = rootEl.value?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(TIP_MAX_WIDTH_PX, window.innerWidth * 0.7)
    const left = Math.min(
      Math.max(EDGE_GAP_PX, rect.left - EDGE_GAP_PX),
      window.innerWidth - width - EDGE_GAP_PX
    )
    tipStyle.value = {
      left: `${Math.round(left)}px`,
      maxWidth: `${Math.round(width)}px`,
      ...(props.side === 'top'
        ? { bottom: `${Math.round(window.innerHeight - rect.top + EDGE_GAP_PX)}px` }
        : { top: `${Math.round(rect.bottom + EDGE_GAP_PX)}px` })
    }
    open.value = true
    // Any scroll/resize invalidates the fixed coords — close instead of tracking.
    window.addEventListener('scroll', closeTip, true)
    window.addEventListener('resize', closeTip)
  }

  onBeforeUnmount(closeTip)
  onDeactivated(closeTip)
</script>

<template>
  <span
    v-if="visible"
    ref="rootEl"
    class="divergence-indicator"
    :class="`divergence-indicator--${variant}`"
    tabindex="0"
    role="img"
    :aria-label="message"
    data-testid="chart-divergence-indicator"
    @mouseenter="openTip"
    @mouseleave="closeTip"
    @focus="openTip"
    @blur="closeTip"
    @keydown.esc="closeTip"
  >
    <i
      :class="[
        'pi',
        variant === 'info' ? 'pi-info-circle' : 'pi-exclamation-triangle',
        'divergence-indicator__icon'
      ]"
      aria-hidden="true"
    />
    <Teleport to="body">
      <span
        v-if="open"
        class="divergence-indicator__tip"
        :style="tipStyle"
        role="tooltip"
      >
        {{ message }}
      </span>
    </Teleport>
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
    color: var(--warning-contrast);
    outline: none;
  }

  .divergence-indicator--info {
    color: var(--text-color-secondary);
  }

  .divergence-indicator:focus-visible {
    box-shadow: 0 0 0 2px var(--warning-border);
  }

  .divergence-indicator__icon {
    font-size: 0.75rem;
    line-height: 1;
  }

  /* Same surface family as the badges/panels (not the inverted pair): dark box
     with a border in dark theme, light box in light theme. */
  .divergence-indicator__tip {
    position: fixed;
    z-index: 1100;
    width: max-content;
    /* Opaque surface: --surface-hover is translucent and would let chart
       content bleed through a floating tip. */
    background: var(--surface-card);
    color: var(--text-color);
    border: 1px solid var(--surface-border);
    font-size: 0.8125rem;
    font-weight: 400;
    line-height: 1.5;
    white-space: normal;
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-radius: var(--border-radius, 6px);
    box-shadow: var(--shadow-lg);
    pointer-events: none;
  }
</style>
