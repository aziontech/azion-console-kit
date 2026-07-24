<script setup>
  import {
    onMounted,
    onBeforeUnmount,
    onActivated,
    onDeactivated,
    ref,
    computed,
    nextTick
  } from 'vue'
  import { useFocusTrap } from '@/composables/useFocusTrap'

  /**
   * ViewSelector — the unified View dropdown for the events chart.
   *
   * Extracted from `event-chart.vue` (task 7.4). Owns the popover (tablet+) and
   * the bottom-sheet (mobile-s + mobile) variants, the focus-trap for the
   * bottom-sheet, and the reposition-on-viewport-change listeners for the
   * teleported popover. Emits `update:view` when a view is selected — the chart
   * shell simply forwards this to its own `update:view` emit, so the public
   * contract of `event-chart.vue` is unchanged.
   *
   * Leak discipline: the focus-trap keydown listener and the viewport listeners
   * are torn down symmetrically on beforeUnmount AND deactivate (keep-alive),
   * matching the ownership the chart shell previously held.
   */

  defineOptions({ name: 'ViewSelector' })

  const props = defineProps({
    // Grouped option model — [{ group, items: [{ label, value, ... }] }].
    viewOptions: { type: Array, default: () => [] },
    view: { type: String, default: 'events:none' },
    // Breakpoint-driven layout: parent passes the same reactive flags the
    // chart uses so the sheet vs popover decision stays consistent.
    isBottomSheetMode: { type: Boolean, default: false },
    // Called right before the menu opens so a residual c3 tooltip can be
    // hidden (touch devices leave one after a previous tap).
    hideTooltip: { type: Function, default: null }
  })

  const emit = defineEmits(['update:view'])

  const viewModel = computed({
    get: () => props.view,
    set: (value) => emit('update:view', value)
  })

  // ── View popover state ──
  // The panel is teleported to <body> so stacking contexts of ancestor
  // containers (chart card, ResizableSplitter) can't clip it. Position is
  // computed from the trigger's bounding rect on open and re-applied on
  // scroll/resize while the menu is open.
  const isViewMenuOpen = ref(false)
  const viewTriggerRef = ref(null)
  const viewPanelRef = ref(null)
  const viewPanelStyle = ref({ top: '0px', left: '0px', minWidth: '0px' })
  // ── Bottom-sheet focus management ──
  // The sheet is a modal-style surface, so it gets a focus trap: focus is kept
  // inside while open, the close button is focused on open, and focus returns
  // to the trigger on close. Owned by `useFocusTrap` (extracted composable);
  // the popover variant is inline and is intentionally NOT trapped (design §7.3).
  const bottomSheetCloseRef = ref(null)

  const selectedViewLabel = computed(() => {
    for (const group of props.viewOptions || []) {
      const match = (group.items || []).find((item) => item.value === props.view)
      if (match) return match.label
    }
    return 'Default'
  })

  const updateViewPanelPosition = () => {
    const trigger = viewTriggerRef.value
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    viewPanelStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.right - Math.max(rect.width, 192)}px`,
      minWidth: `${Math.max(rect.width, 192)}px`
    }
  }

  // Bottom-sheet focus trap. `viewPanelRef` is the trap root (only present while
  // the sheet is open, behind a v-if), the close button gets initial focus, and
  // focus returns to the trigger on close. Escape routes to `closeViewMenu`.
  // The composable owns its own symmetric unmount/deactivate teardown.
  const { activate: activateBottomSheetTrap, deactivate: deactivateBottomSheetTrap } = useFocusTrap(
    viewPanelRef,
    {
      onEscape: () => closeViewMenu(),
      initialFocus: bottomSheetCloseRef,
      returnFocusTo: viewTriggerRef
    }
  )

  const toggleViewMenu = () => {
    const willOpen = !isViewMenuOpen.value
    if (willOpen) {
      // Z-index conflict mitigation: the C3 tooltip is teleported with
      // z-index 99999 and the sheet sits at 100000, but on touch devices the
      // residual tooltip from a previous tap reads as visual noise. Hide it
      // before the sheet animates in.
      try {
        props.hideTooltip?.()
      } catch {
        /* noop — c3 throws when no series is hovered */
      }
    }
    isViewMenuOpen.value = willOpen
    if (willOpen) {
      if (props.isBottomSheetMode) {
        activateBottomSheetTrap()
      } else {
        nextTick(updateViewPanelPosition)
      }
    }
  }
  const closeViewMenu = () => {
    if (!isViewMenuOpen.value) return
    isViewMenuOpen.value = false
    // Always remove the listener; safe to call even if it was never added
    // (e.g., popover branch). This is the leak-defense seam.
    deactivateBottomSheetTrap()
  }
  const selectViewItem = (value) => {
    viewModel.value = value
    closeViewMenu()
  }
  const onViewDocumentClick = (event) => {
    if (!isViewMenuOpen.value) return
    const trigger = viewTriggerRef.value
    const panel = viewPanelRef.value
    if (trigger?.contains(event.target)) return
    if (panel?.contains(event.target)) return
    closeViewMenu()
  }
  const onViewEscape = (event) => {
    if (event.key === 'Escape') closeViewMenu()
  }
  const onViewportChange = () => {
    if (isViewMenuOpen.value) updateViewPanelPosition()
  }

  // ── Viewport resources (keep-alive-safe) ──
  // The document/window/visualViewport listeners that dismiss/reposition the
  // teleported panel are acquired when live (mount OR activate) and released
  // when the component goes away (unmount OR deactivate). Wiring them only to
  // mount/beforeUnmount would leak them across keep-alive cycles.
  const acquireListeners = () => {
    document.addEventListener('mousedown', onViewDocumentClick)
    document.addEventListener('keydown', onViewEscape)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    // Mobile browsers fire `visualViewport.resize` when the URL bar
    // shows/hides and `orientationchange` on rotate — both invalidate the
    // teleported view-panel anchor position.
    window.addEventListener('orientationchange', onViewportChange)
    window.visualViewport?.addEventListener('resize', onViewportChange)
  }

  const releaseListeners = () => {
    document.removeEventListener('mousedown', onViewDocumentClick)
    document.removeEventListener('keydown', onViewEscape)
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
    window.removeEventListener('orientationchange', onViewportChange)
    window.visualViewport?.removeEventListener('resize', onViewportChange)
    // Defense in depth: if the sheet was open when the component goes away, tear
    // down the focus trap too (idempotent — no-op when already inactive).
    deactivateBottomSheetTrap()
  }

  onMounted(acquireListeners)
  onActivated(acquireListeners)
  onBeforeUnmount(releaseListeners)
  onDeactivated(() => {
    releaseListeners()
    closeViewMenu()
  })

  defineExpose({ closeViewMenu })
</script>

<template>
  <div
    class="chart-header__view-control"
    data-testid="event-chart-view"
  >
    <span class="chart-header__view-label">View</span>
    <div class="chart-header__view-menu">
      <button
        ref="viewTriggerRef"
        type="button"
        class="chart-header__view-trigger"
        aria-label="Change chart view"
        :aria-expanded="isViewMenuOpen"
        aria-haspopup="listbox"
        @click="toggleViewMenu"
      >
        <span class="chart-header__view-trigger-label">{{ selectedViewLabel }}</span>
        <i
          class="pi pi-chevron-down chart-header__view-chevron"
          :class="{ 'is-open': isViewMenuOpen }"
        />
      </button>
      <Teleport to="body">
        <template v-if="isViewMenuOpen">
          <!-- BOTTOM-SHEET (mobile-s + mobile) -->
          <template v-if="isBottomSheetMode">
            <div
              class="view-bottom-sheet-backdrop"
              data-testid="rte-chart-bottom-sheet-backdrop"
              @click="closeViewMenu"
            />
            <div
              ref="viewPanelRef"
              class="view-bottom-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rte-view-sheet-title"
              data-testid="rte-chart-bottom-sheet"
            >
              <div
                class="view-bottom-sheet__handle"
                aria-hidden="true"
              />
              <div class="view-bottom-sheet__header">
                <span
                  id="rte-view-sheet-title"
                  class="view-bottom-sheet__title"
                  >View</span
                >
                <button
                  ref="bottomSheetCloseRef"
                  type="button"
                  class="view-bottom-sheet__close"
                  aria-label="Close view menu"
                  data-testid="rte-chart-bottom-sheet-close"
                  @click="closeViewMenu"
                >
                  <i
                    class="pi pi-times"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div
                role="listbox"
                class="view-bottom-sheet__list"
              >
                <template
                  v-for="group in viewOptions"
                  :key="group.group"
                >
                  <div
                    v-if="group.items?.length"
                    class="chart-header__view-group"
                  >
                    <div class="chart-header__view-group-header">{{ group.group }}</div>
                    <button
                      v-for="item in group.items"
                      :key="item.value"
                      type="button"
                      role="option"
                      :aria-selected="item.value === viewModel"
                      class="chart-header__view-item"
                      :class="{ 'is-selected': item.value === viewModel }"
                      @click="selectViewItem(item.value)"
                    >
                      <span class="chart-header__view-item-label">{{ item.label }}</span>
                      <i
                        v-if="item.value === viewModel"
                        class="pi pi-check chart-header__view-item-check"
                      />
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </template>

          <!-- POPOVER (tablet+) — existing behavior preserved -->
          <template v-else>
            <div
              ref="viewPanelRef"
              class="chart-header__view-panel"
              :style="viewPanelStyle"
              role="listbox"
            >
              <template
                v-for="group in viewOptions"
                :key="group.group"
              >
                <div
                  v-if="group.items?.length"
                  class="chart-header__view-group"
                >
                  <div class="chart-header__view-group-header">{{ group.group }}</div>
                  <button
                    v-for="item in group.items"
                    :key="item.value"
                    type="button"
                    role="option"
                    :aria-selected="item.value === viewModel"
                    class="chart-header__view-item"
                    :class="{ 'is-selected': item.value === viewModel }"
                    @click="selectViewItem(item.value)"
                  >
                    <span class="chart-header__view-item-label">{{ item.label }}</span>
                    <i
                      v-if="item.value === viewModel"
                      class="pi pi-check chart-header__view-item-check"
                    />
                  </button>
                </div>
              </template>
            </div>
          </template>
        </template>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
  .chart-header__view-control {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .chart-header__view-label {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    letter-spacing: 0.01em;
  }

  .chart-header__view-menu {
    position: relative;
  }

  .chart-header__view-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 7rem;
    max-width: 12rem;
    height: 1.75rem;
    padding: 0 0.5rem;
    font-family: var(--font-family);
    font-size: 0.75rem;
    color: var(--text-color);
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    cursor: pointer;
    transition:
      border-color 120ms ease,
      background 120ms ease;
  }
  .chart-header__view-trigger:hover,
  .chart-header__view-trigger[aria-expanded='true'] {
    border-color: var(--primary-color);
    background: var(--surface-hover, var(--surface-card));
  }

  .chart-header__view-trigger-label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .chart-header__view-chevron {
    font-size: 0.625rem;
    color: var(--text-color-secondary);
    transition: transform 120ms ease;
  }
  .chart-header__view-chevron.is-open {
    transform: rotate(180deg);
  }

  .chart-header__view-panel {
    position: fixed;
    z-index: 1000;
    min-width: 12rem;
    max-height: 20rem;
    overflow-y: auto;
    padding: 0.25rem 0;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
  }

  .chart-header__view-group + .chart-header__view-group {
    border-top: 1px solid var(--surface-border);
    margin-top: 0.25rem;
    padding-top: 0.25rem;
  }

  .chart-header__view-group-header {
    padding: 0.375rem 0.75rem 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-color-secondary);
    opacity: 0.85;
  }

  .chart-header__view-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-family: var(--font-family);
    font-size: 0.75rem;
    color: var(--text-color);
    background: transparent;
    border: 0;
    cursor: pointer;
    text-align: left;
  }
  .chart-header__view-item:hover {
    background: var(--surface-hover);
  }
  .chart-header__view-item.is-selected {
    color: var(--primary-color);
    font-weight: 600;
  }

  .chart-header__view-item-check {
    font-size: 0.6875rem;
    color: var(--primary-color);
  }

  /* ──────────────────────────────────────────────────────────────────
   * Bottom-sheet variant of the View dropdown
   * Used on mobile-s + mobile (<640px). Tablet+ keeps the anchored
   * popover (.chart-header__view-panel). Backdrop sits below the sheet
   * but above the C3 tooltip (z=99999) to ensure visual layering even
   * if a tooltip is residual on open.
   * ────────────────────────────────────────────────────────────────── */
  .view-bottom-sheet-backdrop {
    position: fixed;
    inset: 0;
    background: var(--maskbg);
    z-index: 99998;
    animation: rte-fade-in 280ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  .view-bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100000;
    background: var(--surface-card);
    border-top: 1px solid var(--surface-border);
    border-radius: 12px 12px 0 0;
    max-height: 60dvh;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom);
    animation: rte-slide-up 280ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  .view-bottom-sheet__handle {
    width: 2.5rem;
    height: 0.25rem;
    background: var(--surface-border);
    border-radius: 999px;
    margin: 0.5rem auto;
  }

  .view-bottom-sheet__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem 1rem 0.5rem;
  }

  .view-bottom-sheet__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .view-bottom-sheet__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-color-secondary);
    border-radius: 6px;
  }

  .view-bottom-sheet__close:hover {
    background: var(--surface-hover);
  }

  .view-bottom-sheet__list {
    padding-bottom: 0.5rem;
  }

  .view-bottom-sheet__list .chart-header__view-item {
    min-height: 2.75rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }

  @keyframes rte-slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes rte-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .view-bottom-sheet,
    .view-bottom-sheet-backdrop {
      animation-duration: 120ms !important;
    }
    .view-bottom-sheet {
      animation-name: rte-fade-in;
    }
  }

  /* ── Responsive breakpoints ── */
  @media (max-width: 640px) {
    /*
     * Mobile view-trigger: tight bounds (5rem floor / 7rem ceiling) so the
     * dropdown label can ellipsize without pushing the count out of the
     * header. Height stays at 1.5rem for compact density.
     */
    .chart-header__view-trigger {
      min-width: 5rem;
      max-width: 7rem;
      font-size: 0.6875rem;
      height: 1.5rem;
    }

    .chart-header__view-label {
      display: none;
    }
  }
</style>
