<script setup>
  import { ref, toRef } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import Checkbox from '@aziontech/webkit/checkbox'
  import ProgressBar from '@aziontech/webkit/progressbar'
  import { useFieldStats } from '../../composables/useFieldStats'

  defineOptions({ name: 'FieldSidebar' })

  const props = defineProps({
    availableFields: {
      type: Array,
      default: () => []
    },
    selectedFields: {
      type: Array,
      default: () => []
    },
    data: {
      type: Array,
      default: () => []
    },
    visible: {
      type: Boolean,
      default: false
    },
    datasets: {
      type: Array,
      default: () => []
    },
    selectedDataset: {
      type: Object,
      default: null
    }
  })

  const emit = defineEmits([
    'update:selectedFields',
    'update:visible',
    'add-filter',
    'update:selectedDataset'
  ])

  const searchQuery = ref('')

  // All field-list derivations (stats, search filter, pinned partition) live
  // in `useFieldStats` so this component stays purely presentational.
  const { fieldStats, filteredFields, pinnedFields, availableFieldsNonPinned, isFieldSelected } =
    useFieldStats({
      data: toRef(props, 'data'),
      availableFields: toRef(props, 'availableFields'),
      searchQuery,
      selectedFields: toRef(props, 'selectedFields')
    })

  const toggleField = (fieldValue) => {
    const current = [...props.selectedFields]
    const index = current.indexOf(fieldValue)
    if (index >= 0) {
      current.splice(index, 1)
    } else {
      current.push(fieldValue)
    }
    emit('update:selectedFields', current)
  }

  const closeSidebar = () => {
    emit('update:visible', false)
  }

  const handleAddFilter = (fieldName, value) => {
    emit('add-filter', fieldName, value)
  }

  const truncateFieldValue = (value, maxLen = 30) => {
    if (!value) return '-'
    return value.length > maxLen ? `${value.slice(0, maxLen)}…` : value
  }

  const expandedField = ref(null)
  const toggleFieldStats = (fieldName) => {
    expandedField.value = expandedField.value === fieldName ? null : fieldName
  }
</script>

<template>
  <transition name="slide-sidebar">
    <div
      v-if="visible"
      class="field-sidebar"
      data-testid="field-sidebar"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-3 border-b surface-border">
        <span class="text-sm font-medium text-color">Fields</span>
        <PrimeButton
          icon="pi pi-times"
          text
          rounded
          size="small"
          class="!w-7 !h-7"
          @click="closeSidebar"
          data-testid="field-sidebar-close"
        />
      </div>

      <!-- Search fields -->
      <div class="p-3 border-b surface-border">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Search fields..."
            class="w-full h-8 text-sm"
            data-testid="field-sidebar-search"
          />
        </span>
      </div>

      <!-- Selected fields -->
      <div
        v-if="selectedFields.length"
        class="border-b surface-border"
      >
        <div class="px-3 py-2">
          <span class="text-xs font-medium text-color-secondary uppercase tracking-wide">
            Selected ({{ selectedFields.length }})
          </span>
        </div>
        <div class="flex flex-col">
          <div
            v-for="fieldName in selectedFields"
            :key="'sel-' + fieldName"
            class="flex items-center gap-2 px-3 py-1.5 hover:surface-hover cursor-pointer"
            data-testid="field-sidebar-selected-item"
          >
            <Checkbox
              :modelValue="true"
              :binary="true"
              class="!w-4 !h-4"
              @click="toggleField(fieldName)"
            />
            <span
              class="text-xs text-color flex-1 truncate"
              @click="toggleFieldStats(fieldName)"
            >
              {{ fieldName }}
            </span>
          </div>
        </div>
      </div>

      <!-- Available fields (Pinned + Available sections) -->
      <div class="flex-1 overflow-y-auto">
        <!-- Pinned section -->
        <template v-if="pinnedFields.length">
          <div class="px-3 py-2 flex items-center gap-1.5">
            <i class="pi pi-bookmark-fill field-sidebar__pin-icon" />
            <span class="field-sidebar__pin-label">PINNED</span>
          </div>
          <div class="flex flex-col">
            <div
              v-for="field in pinnedFields"
              :key="'pinned-' + field.value"
              class="flex flex-col"
            >
              <div
                class="flex items-center gap-2 px-3 py-1.5 hover:surface-hover cursor-pointer"
                @click="toggleFieldStats(field.value)"
                data-testid="field-sidebar-pinned-item"
              >
                <Checkbox
                  :modelValue="isFieldSelected(field.value)"
                  :binary="true"
                  class="!w-4 !h-4"
                  @click.stop="toggleField(field.value)"
                />
                <span
                  class="text-xs flex-1 truncate"
                  :class="isFieldSelected(field.value) ? 'text-color font-medium' : 'text-color'"
                >
                  {{ field.value }}
                </span>
                <span
                  v-if="fieldStats[field.value]"
                  class="text-xs text-color-secondary"
                  v-tooltip.top="{
                    value: `${fieldStats[field.value].uniqueCount} unique values in loaded page`,
                    showDelay: 300
                  }"
                >
                  {{ fieldStats[field.value].uniqueCount }}
                </span>
              </div>

              <div
                v-if="expandedField === field.value && fieldStats[field.value]"
                class="px-3 pb-2 ml-6"
              >
                <div class="rounded surface-hover p-2">
                  <div class="text-xs text-color-secondary mb-1">
                    Top {{ fieldStats[field.value].topValues.length }} of
                    {{ fieldStats[field.value].uniqueCount }} values
                  </div>
                  <div
                    v-for="(stat, statIdx) in fieldStats[field.value].topValues"
                    :key="statIdx"
                    class="field-sidebar__topvalue-row"
                    :title="stat.value"
                    @click="handleAddFilter(field.value, stat.value)"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between text-xs mb-0.5">
                        <span class="truncate text-color">
                          {{ truncateFieldValue(stat.value) }}
                        </span>
                        <span class="text-color-secondary ml-1 whitespace-nowrap">
                          {{ stat.percent }}%
                        </span>
                      </div>
                      <ProgressBar
                        :value="stat.percent"
                        :showValue="false"
                        class="!h-1"
                      />
                    </div>
                  </div>
                  <div class="field-sidebar__topvalue-hint">Click a value to add as filter</div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="availableFieldsNonPinned.length"
            class="field-sidebar__divider"
          />
        </template>

        <!-- Available section -->
        <div class="px-3 py-2">
          <span class="text-xs font-medium text-color-secondary uppercase tracking-wide">
            Available
          </span>
        </div>
        <div class="flex flex-col">
          <div
            v-for="field in availableFieldsNonPinned"
            :key="field.value"
            class="flex flex-col"
          >
            <div
              class="flex items-center gap-2 px-3 py-1.5 hover:surface-hover cursor-pointer"
              @click="toggleFieldStats(field.value)"
              data-testid="field-sidebar-available-item"
            >
              <Checkbox
                :modelValue="isFieldSelected(field.value)"
                :binary="true"
                class="!w-4 !h-4"
                @click.stop="toggleField(field.value)"
              />
              <span
                class="text-xs flex-1 truncate"
                :class="isFieldSelected(field.value) ? 'text-color font-medium' : 'text-color'"
              >
                {{ field.value }}
              </span>
              <span
                v-if="fieldStats[field.value]"
                class="text-xs text-color-secondary"
              >
                {{ fieldStats[field.value].uniqueCount }}
              </span>
            </div>

            <!-- Field statistics -->
            <div
              v-if="expandedField === field.value && fieldStats[field.value]"
              class="px-3 pb-2 ml-6"
            >
              <div class="rounded surface-hover p-2">
                <div class="text-xs text-color-secondary mb-1">
                  Top {{ fieldStats[field.value].topValues.length }} of
                  {{ fieldStats[field.value].uniqueCount }} values
                </div>
                <div
                  v-for="(stat, statIdx) in fieldStats[field.value].topValues"
                  :key="statIdx"
                  class="field-sidebar__topvalue-row"
                  :title="stat.value"
                  @click="handleAddFilter(field.value, stat.value)"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between text-xs mb-0.5">
                      <span class="truncate text-color">
                        {{ truncateFieldValue(stat.value) }}
                      </span>
                      <span class="text-color-secondary ml-1 whitespace-nowrap">
                        {{ stat.percent }}%
                      </span>
                    </div>
                    <ProgressBar
                      :value="stat.percent"
                      :showValue="false"
                      class="!h-1"
                    />
                  </div>
                </div>
                <div class="field-sidebar__topvalue-hint">Click a value to add as filter</div>
              </div>
            </div>
          </div>

          <div
            v-if="!filteredFields.length"
            class="px-3 py-2 text-sm text-color-secondary"
          >
            No fields match your search.
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
  .field-sidebar {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border-right: 1px solid var(--surface-border);
    background: var(--surface-ground);
  }

  .field-sidebar__pin-icon {
    font-size: 12px;
    color: var(--primary-color);
  }

  .field-sidebar__pin-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--primary-color);
    text-transform: uppercase;
  }

  .field-sidebar__divider {
    height: 1px;
    background: var(--surface-border);
    margin: 8px 12px;
  }

  .field-sidebar__topvalue-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .field-sidebar__topvalue-row:hover {
    background-color: var(--surface-hover);
  }

  .field-sidebar__topvalue-hint {
    font-size: 10px;
    color: var(--text-color-secondary);
    font-style: italic;
    margin-top: 6px;
    opacity: 0.8;
  }

  .slide-sidebar-enter-active,
  .slide-sidebar-leave-active {
    transition: all 0.2s ease;
  }

  .slide-sidebar-enter-from,
  .slide-sidebar-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }
</style>
