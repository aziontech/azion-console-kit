<script setup>
  import { ref, computed } from 'vue'
  import OverlayPanel from 'primevue/overlaypanel'
  import Dropdown from 'primevue/dropdown'
  import PrimeButton from 'primevue/button'
  import { filterBuilder } from './filters/filter-builder'

  const props = defineProps({
    filters: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits(['apply'])

  const overlayPanel = ref(null)
  const selectedField = ref(null)
  const filterValue = ref('')
  const isEmailValid = ref(true)

  const filterOptions = computed(() => {
    const filterOptions = props.filters
      .filter((col) => col.header && col.header !== 'Last Modified')
      .map((col) => ({
        label: col.header,
        value: col.field?.toLowerCase()
      }))

    return filterOptions
  })

  const filterComponent = computed(() => {
    if (!selectedField.value) return null

    return filterBuilder({
      filterKey: selectedField.value,
      filterValue: filterValue.value,
      onUpdate: (value) => {
        filterValue.value = value
      },
      onValidation: (isValid) => {
        isEmailValid.value = isValid
      }
    })
  })

  const isLastEditorField = computed(() => selectedField.value?.toLowerCase() === 'last_editor')

  const handleFieldChange = () => {
    filterValue.value = ''
    isEmailValid.value = true
  }

  const toggle = (event) => {
    overlayPanel.value.toggle(event)
  }

  const handleCancel = () => {
    overlayPanel.value.hide()
    selectedField.value = null
    filterValue.value = ''
    isEmailValid.value = true
  }

  const handleApply = () => {
    const hasValue =
      filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== ''

    if (!selectedField.value || !hasValue) {
      return
    }

    if (isLastEditorField.value && !isEmailValid.value) {
      return
    }

    const selectedOption = filterOptions.value.find((opt) => opt.value === selectedField.value)
    emit('apply', {
      field: selectedField.value,
      label: selectedOption.label,
      value: filterValue.value
    })

    overlayPanel.value.hide()
    selectedField.value = null
    filterValue.value = ''
    isEmailValid.value = true
  }

  defineExpose({ toggle })
</script>
<template>
  <OverlayPanel
    ref="overlayPanel"
    :pt="{
      root: { class: 'md:w-[600px] w-[400px]' },
      content: { class: 'p-0' }
    }"
  >
    <div class="flex flex-col">
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)]"
      >
        <h3 class="text-lg font-semibold">Filter</h3>
        <PrimeButton
          outlined
          icon="pi pi-times"
          class="color-[var(--actionIconColor)]"
          @click="handleCancel"
        />
      </div>

      <div class="flex flex-col gap-4 p-0">
        <div
          class="flex flex-col gap-[14px] px-6 pt-5"
          :class="{ 'py-6': !selectedField }"
        >
          <p class="text-sm text-color-secondary">
            Each combination of operator can only be used once.
          </p>
          <label
            for="filter-field"
            class="text-sm font-medium"
          >
            Filter
          </label>
          <Dropdown
            id="filter-field"
            v-model="selectedField"
            :options="filterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a field"
            class="w-[50%]"
            @change="handleFieldChange"
          />
        </div>

        <div
          v-if="selectedField"
          class="flex flex-col gap-2 border-t border-[var(--surface-border)] px-6 py-4"
        >
          <component :is="filterComponent" />
        </div>
      </div>

      <div class="flex justify-end gap-2 px-6 py-4 border-t border-[var(--surface-border)]">
        <PrimeButton
          label="Cancel"
          outlined
          @click="handleCancel"
        />
        <PrimeButton
          label="Apply"
          severity="secondary"
          @click="handleApply"
        />
      </div>
    </div>
  </OverlayPanel>
</template>
