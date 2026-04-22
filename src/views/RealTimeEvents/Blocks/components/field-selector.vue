<script setup>
  import { ref, computed, watch } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import InputText from '@aziontech/webkit/inputtext'
  import Checkbox from '@aziontech/webkit/checkbox'

  defineOptions({ name: 'FieldSelector' })

  const props = defineProps({
    availableFields: {
      type: Array,
      default: () => []
    },
    selectedFields: {
      type: Array,
      default: () => []
    },
    dataset: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['update:selectedFields'])

  const overlayRef = ref(null)
  const searchQuery = ref('')
  const sortedAvailableFields = computed(() =>
    [...props.availableFields].sort((left, right) => left.value.localeCompare(right.value))
  )

  const filteredFields = computed(() => {
    if (!searchQuery.value) return sortedAvailableFields.value
    const query = searchQuery.value.toLowerCase()
    return sortedAvailableFields.value.filter((field) => field.label.toLowerCase().includes(query))
  })

  const selectedSet = computed(() => new Set(props.selectedFields))

  const isFieldSelected = (fieldValue) => {
    return selectedSet.value.has(fieldValue)
  }

  const toggleField = (fieldValue) => {
    const current = [...props.selectedFields]
    const index = current.indexOf(fieldValue)
    if (index >= 0) {
      current.splice(index, 1)
    } else {
      current.push(fieldValue)
    }
    emit('update:selectedFields', current)
    persistSelection(current)
  }

  const clearAllFields = () => {
    emit('update:selectedFields', [])
    persistSelection([])
  }

  const togglePanel = (event) => {
    overlayRef.value?.toggle(event)
  }

  const STORAGE_KEY_PREFIX = 'rte-selected-fields-'

  const persistSelection = (fields) => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${props.dataset}`, JSON.stringify(fields))
    } catch {
      // localStorage not available
    }
  }

  const loadPersistedSelection = () => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${props.dataset}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          emit('update:selectedFields', parsed)
        }
      }
    } catch {
      // localStorage not available
    }
  }

  watch(
    () => props.dataset,
    () => {
      loadPersistedSelection()
    },
    { immediate: true }
  )

  defineExpose({ togglePanel })
</script>

<template>
  <div>
    <PrimeButton
      outlined
      icon="ai ai-column"
      class="min-w-max"
      @click="togglePanel"
      v-tooltip.left="{ value: 'Select fields as columns', showDelay: 200 }"
      data-testid="field-selector-toggle"
    />
    <OverlayPanel
      ref="overlayRef"
      :pt="{
        content: { class: 'p-0' }
      }"
      data-testid="field-selector-panel"
    >
      <div class="w-[280px] max-h-[400px] flex flex-col">
        <div class="p-3 border-b surface-border">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-color">Select Columns</span>
            <PrimeButton
              v-if="selectedFields.length"
              text
              size="small"
              label="Clear all"
              class="!p-0 !h-auto text-xs"
              @click="clearAllFields"
              data-testid="field-selector-clear"
            />
          </div>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Search fields..."
              class="w-full h-8 text-sm"
              data-testid="field-selector-search"
            />
          </span>
        </div>

        <div
          v-if="selectedFields.length"
          class="px-3 py-2 border-b surface-border"
        >
          <span class="text-xs font-medium text-color-secondary uppercase tracking-wide"
            >Selected ({{ selectedFields.length }})</span
          >
          <div class="flex flex-col gap-1 mt-1">
            <div
              v-for="fieldValue in selectedFields"
              :key="'sel-' + fieldValue"
              class="flex items-center gap-2 py-1 px-1 rounded hover:surface-hover cursor-pointer"
              @click="toggleField(fieldValue)"
              data-testid="field-selector-selected-item"
            >
              <Checkbox
                :modelValue="true"
                :binary="true"
                class="!w-4 !h-4"
              />
              <span class="text-sm text-color font-mono">{{ fieldValue }}</span>
            </div>
          </div>
        </div>

        <div class="px-3 py-2 overflow-y-auto max-h-[250px]">
          <span class="text-xs font-medium text-color-secondary uppercase tracking-wide"
            >Available Fields</span
          >
          <div class="flex flex-col gap-0.5 mt-1">
            <div
              v-for="field in filteredFields"
              :key="field.value"
              class="flex items-center gap-2 py-1 px-1 rounded hover:surface-hover cursor-pointer"
              @click="toggleField(field.value)"
              data-testid="field-selector-available-item"
            >
              <Checkbox
                :modelValue="isFieldSelected(field.value)"
                :binary="true"
                class="!w-4 !h-4"
              />
              <span
                class="text-sm font-mono"
                :class="isFieldSelected(field.value) ? 'text-color font-medium' : 'text-color'"
              >
                {{ field.value }}
              </span>
            </div>
            <div
              v-if="!filteredFields.length"
              class="py-2 text-sm text-color-secondary"
            >
              No fields match your search.
            </div>
          </div>
        </div>
      </div>
    </OverlayPanel>
  </div>
</template>
