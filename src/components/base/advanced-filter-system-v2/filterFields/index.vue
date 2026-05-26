<template>
  <div>
    <PrimeButton
      icon="pi pi-filter"
      outlined
      size="small"
      @click="toggleOverPanel"
    />

    <!-- OverPanel — sized proportionally to the viewport so the modal
         adapts to any resolution without hardcoded pixel breakpoints.
         - max-h: 80vh (caps at 80% of viewport height — never overflows)
         - h: auto (sizes to content — no forced fixed height)
         - max-w: min(90vw, 56rem) (90% of viewport, capped at ~896px for
           ergonomics on very wide screens) -->
    <OverlayPanel
      ref="overPanelRef"
      appendTo="body"
      aria-haspopup="true"
      aria-controls="overlay_panel"
      class="overflow-y-auto"
      :pt="{
        root: {
          class: 'p-0 w-[min(90vw,56rem)] max-h-[80vh]'
        },
        content: { class: 'p-0' }
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
