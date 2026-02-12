<template>
  <div
    class="flex justify-end"
    data-testid="data-table-actions-column-header"
  >
    <PrimeButton
      outlined
      icon="ai ai-column"
      @click="toggleColumnSelector"
      v-tooltip.top="{ value: 'Available Columns', showDelay: 200 }"
      data-testid="data-table-actions-column-header-toggle-columns"
    />
    <OverlayPanel
      ref="columnSelectorPanel"
      :pt="{
        content: { class: 'p-0' }
      }"
      data-testid="data-table-actions-column-header-toggle-columns-panel"
    >
      <Listbox
        v-model="selectedColumns"
        multiple
        :options="[{ label: 'Available Columns', items: columns }]"
        class="hidden-columns-panel"
        optionLabel="header"
        optionGroupLabel="label"
        optionGroupChildren="items"
        data-testid="data-table-actions-column-header-toggle-columns-panel-listbox"
      >
        <template #optiongroup="slotProps">
          <p class="text-sm font-medium">
            {{ slotProps.option.label }}
          </p>
        </template>
        <template #option="slotProps">
          <div
            :class="{
              'opacity-50 pointer-events-none': slotProps.option.field === 'name'
            }"
          >
            {{ slotProps.option.header }}
          </div>
        </template>
      </Listbox>
    </OverlayPanel>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import PrimeButton from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import Listbox from 'primevue/listbox'

  const props = defineProps({
    columns: {
      type: Array,
      required: true
    },
    selectedColumns: {
      type: Array,
      required: true
    }
  })

  const emit = defineEmits(['update:selectedColumns'])

  const columnSelectorPanel = ref(null)

  const selectedColumns = computed({
    get: () => props.selectedColumns,
    set: (value) => {
      const nameColumn = props.columns.find((col) => col.field === 'name')
      if (nameColumn && !value.some((col) => col.field === 'name')) {
        value = [nameColumn, ...value]
      }
      emit('update:selectedColumns', value)
    }
  })

  const toggleColumnSelector = (event) => {
    columnSelectorPanel.value.toggle(event)
  }

  defineExpose({
    toggleColumnSelector
  })
</script>
