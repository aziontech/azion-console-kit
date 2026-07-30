<template>
  <div>
    <PrimeButton
      icon="pi pi-plus"
      outlined
      size="small"
      @click="toggleOverPanel"
    />

    <!-- OverPanel -->
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
  }

  const onApplyFilter = (filterData) => {
    emit('apply-filter', filterData)
    overPanelRef.value.hide()
  }

  const onCancel = () => {
    overPanelRef.value.hide()
  }
</script>
