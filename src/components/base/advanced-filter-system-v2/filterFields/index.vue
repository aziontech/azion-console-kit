<template>
  <div>
    <PrimeButton
      icon="pi pi-filter"
      outlined
      size="small"
      @click="toggleOverPanel"
    />

    <!-- OverPanel — fixed responsive width so the modal stays stable
         across field/operator changes (no resize jank as inner content
         reflows). Width is driven by CSS media queries on `.filter-overlay`:
         - desktop (>=1024px): 35rem (560px) fixed
         - tablet  (640-1023px): min(35rem, 90vw)
         - mobile  (<640px): calc(100vw - 1rem) (near full-bleed)
         max-h: 80vh caps height; content reflows inside fixed width. -->
    <OverlayPanel
      ref="overPanelRef"
      appendTo="body"
      aria-haspopup="true"
      aria-controls="overlay_panel"
      class="overflow-y-auto"
      :style="{ width: 'var(--filter-overlay-width, 35rem)' }"
      :pt="{
        root: {
          class: 'filter-overlay p-0 max-h-[80vh] overflow-hidden'
        },
        content: { class: 'p-0 overflow-hidden' }
      }"
    >
      <FilterPanel
        v-model="model"
        :filtersOptions="props.filtersOptions"
        @apply-filter="onApplyFilter"
        @cancel="onCancel"
      />
    </OverlayPanel>
  </div>
</template>

<script setup>
  import { ref, defineModel } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import FilterPanel from './filterPanel/index.vue'

  defineOptions({ name: 'FilterFields' })

  // Model
  const model = defineModel({
    type: [Array, Object],
    default: () => []
  })

  // Props
  const props = defineProps({
    filtersOptions: {
      type: Array,
      required: true
    }
  })

  // Emits
  const emit = defineEmits(['apply-filter'])

  // Refs
  const overPanelRef = ref(null)

  // Methods
  const toggleOverPanel = (event) => {
    overPanelRef.value.toggle(event)
    // Drop focus from the trigger after click so the focus ring doesn't
    // linger while the panel is open. Keyboard users navigating via Tab
    // still get the focus ring via :focus-visible — this only suppresses
    // the visual side-effect of mouse clicks.
    event.currentTarget?.blur?.()
  }

  const onApplyFilter = (filterData) => {
    emit('apply-filter', filterData)
    overPanelRef.value.hide()
  }

  const onCancel = () => {
    overPanelRef.value.hide()
  }
</script>

<style>
  /* Responsive OverlayPanel width. The panel is teleported to <body>
     (appendTo="body"), so this rule must be UNSCOPED to reach the
     teleported root. Width is fixed per breakpoint to keep the modal
     stable as the user changes field/operator inside it.
     Desktop: 700px (43.75rem) — comfortable for 1920x+ without waste
     Tablet: 90vw capped at 700px
     Mobile: full bleed minus 1rem */
  :root {
    --filter-overlay-width: 43.75rem;
  }

  @media (max-width: 1023px) {
    :root {
      --filter-overlay-width: min(43.75rem, 90vw);
    }
  }

  @media (max-width: 639px) {
    :root {
      --filter-overlay-width: calc(100vw - 1rem);
    }
  }

  .filter-overlay {
    width: var(--filter-overlay-width, 43.75rem) !important;
    overflow: hidden !important;
  }
</style>
