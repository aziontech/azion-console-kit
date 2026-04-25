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
      <div class="field-sidebar-header">
        <span class="text-sm font-medium text-color">Fields</span>
        <PrimeButton
          icon="pi pi-times"
          text
          rounded
          size="small"
          class="!w-6 !h-6 !p-0"
          @click="closeSidebar"
          data-testid="field-sidebar-close"
        />
      </div>

      <!-- Search fields -->
      <div class="field-sidebar-search">
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
        <div class="field-sidebar__section-label">
          <span class="text-xs font-medium text-color-secondary uppercase tracking-wide">
            Selected ({{ selectedFields.length }})
          </span>
        </div>
        <div class="flex flex-col">
          <div
            v-for="fieldName in selectedFields"
            :key="'sel-' + fieldName"
            class="field-sidebar__row"
            data-testid="field-sidebar-selected-item"
          >
            <Checkbox
              :modelValue="true"
              :binary="true"
              class="!w-4 !h-4 flex-shrink-0"
              @click="toggleField(fieldName)"
            />
            <span
              class="field-sidebar__row-name field-sidebar__row-name--selected"
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
          <div class="field-sidebar__section-label">
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
                class="field-sidebar__row"
                @click="toggleFieldStats(field.value)"
                data-testid="field-sidebar-pinned-item"
              >
                <Checkbox
                  :modelValue="isFieldSelected(field.value)"
                  :binary="true"
                  class="!w-4 !h-4 flex-shrink-0"
                  @click.stop="toggleField(field.value)"
                />
                <span
                  class="field-sidebar__row-name"
                  :class="{ 'field-sidebar__row-name--selected': isFieldSelected(field.value) }"
                >
                  {{ field.value }}
                </span>
                <span
                  v-if="fieldStats[field.value]"
                  class="field-sidebar__row-count"
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
                class="field-sidebar__stats"
              >
                <div class="field-sidebar__stats-title">
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
                  <div class="field-sidebar__topvalue-meta">
                    <span class="field-sidebar__topvalue-label">{{ truncateFieldValue(stat.value) }}</span>
                    <span class="field-sidebar__topvalue-pct">{{ stat.percent }}%</span>
                  </div>
                  <ProgressBar :value="stat.percent" :showValue="false" class="!h-1" />
                </div>
                <div class="field-sidebar__topvalue-hint">Click a value to add as filter</div>
              </div>
            </div>
          </div>
          <div v-if="availableFieldsNonPinned.length" class="field-sidebar__divider" />
        </template>

        <!-- Available section -->
        <div class="field-sidebar__section-label">
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
              class="field-sidebar__row"
              @click="toggleFieldStats(field.value)"
              data-testid="field-sidebar-available-item"
            >
              <Checkbox
                :modelValue="isFieldSelected(field.value)"
                :binary="true"
                class="!w-4 !h-4 flex-shrink-0"
                @click.stop="toggleField(field.value)"
              />
              <span
                class="field-sidebar__row-name"
                :class="{ 'field-sidebar__row-name--selected': isFieldSelected(field.value) }"
              >
                {{ field.value }}
              </span>
              <span v-if="fieldStats[field.value]" class="field-sidebar__row-count">
                {{ fieldStats[field.value].uniqueCount }}
              </span>
            </div>

            <!-- Field statistics -->
            <div
              v-if="expandedField === field.value && fieldStats[field.value]"
              class="field-sidebar__stats"
            >
              <div class="field-sidebar__stats-title">
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
                <div class="field-sidebar__topvalue-meta">
                  <span class="field-sidebar__topvalue-label">{{ truncateFieldValue(stat.value) }}</span>
                  <span class="field-sidebar__topvalue-pct">{{ stat.percent }}%</span>
                </div>
                <ProgressBar :value="stat.percent" :showValue="false" class="!h-1" />
              </div>
              <div class="field-sidebar__topvalue-hint">Click a value to add as filter</div>
            </div>
          </div>

          <div
            v-if="!filteredFields.length"
            class="px-3 py-3 text-xs text-color-secondary"
          >
            No fields match your search.
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
  /* ── Container ─────────────────────────────────────────────────── */
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

  /* ── Header ─────────────────────────────────────────────────────── */
  .field-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.75rem;
    height: 2.25rem;
    flex-shrink: 0;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-section);
  }

  /* ── Search ──────────────────────────────────────────────────────── */
  .field-sidebar-search {
    padding: 0.5rem 0.75rem;
    flex-shrink: 0;
    border-bottom: 1px solid var(--surface-border);
  }

  /* ── Section labels (PINNED / AVAILABLE / SELECTED) ─────────────── */
  .field-sidebar__section-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem 0.25rem;
  }

  /* ── Field row ───────────────────────────────────────────────────── */
  .field-sidebar__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3125rem 0.75rem;
    min-height: 2rem;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .field-sidebar__row:hover {
    background: var(--surface-hover);
  }

  .field-sidebar__row-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    color: var(--text-color);
  }

  .field-sidebar__row-name--selected {
    font-weight: 600;
  }

  .field-sidebar__row-count {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
    min-width: 1.5rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Stats panel ─────────────────────────────────────────────────── */
  .field-sidebar__stats {
    margin: 0 0.75rem 0.375rem 1.75rem;
    padding: 0.5rem 0.625rem;
    border-radius: var(--border-radius);
    background: var(--surface-hover);
  }

  .field-sidebar__stats-title {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.375rem;
  }

  .field-sidebar__topvalue-row {
    display: flex;
    flex-direction: column;
    gap: 0.1875rem;
    padding: 0.25rem 0.375rem;
    border-radius: calc(var(--border-radius) - 2px);
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .field-sidebar__topvalue-row:hover {
    background: var(--surface-card);
  }

  .field-sidebar__topvalue-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.25rem;
  }

  .field-sidebar__topvalue-label {
    font-size: 0.75rem;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .field-sidebar__topvalue-pct {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .field-sidebar__topvalue-hint {
    font-size: 0.625rem;
    color: var(--text-color-secondary);
    font-style: italic;
    margin-top: 0.375rem;
    padding: 0 0.375rem;
    opacity: 0.75;
  }

  /* ── Divider ─────────────────────────────────────────────────────── */
  .field-sidebar__divider {
    height: 1px;
    background: var(--surface-border);
    margin: 0.375rem 0.75rem;
  }

  /* ── Pin icon / label ────────────────────────────────────────────── */
  .field-sidebar__pin-icon {
    font-size: 0.6875rem;
    color: var(--primary-color);
  }

  .field-sidebar__pin-label {
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--primary-color);
    text-transform: uppercase;
  }

  /* ── Slide transition ────────────────────────────────────────────── */
  .slide-sidebar-enter-active,
  .slide-sidebar-leave-active {
    transition: all 0.2s ease;
  }

  .slide-sidebar-enter-from,
  .slide-sidebar-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }

  /* ── Responsive ──────────────────────────────────────────────────── */
  /* Compact on small screens */
  @media (max-width: 640px) {
    .field-sidebar__row {
      padding: 0.25rem 0.625rem;
      min-height: 1.75rem;
    }

    .field-sidebar-search {
      padding: 0.375rem 0.625rem;
    }

    .field-sidebar__stats {
      margin: 0 0.625rem 0.25rem 1.5rem;
    }
  }

  /* Generous on large screens */
  @media (min-width: 1920px) {
    .field-sidebar__row {
      padding: 0.375rem 1rem;
      min-height: 2.25rem;
    }

    .field-sidebar-header {
      padding: 0 1rem;
    }

    .field-sidebar-search {
      padding: 0.625rem 1rem;
    }

    .field-sidebar__stats {
      margin: 0 1rem 0.5rem 2rem;
    }

    .field-sidebar__section-label {
      padding: 0.5rem 1rem 0.25rem;
    }
  }
</style>
