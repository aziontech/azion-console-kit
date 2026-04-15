<script setup>
  import { ref, computed } from 'vue'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import Checkbox from 'primevue/checkbox'
  import ProgressBar from 'primevue/progressbar'

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

  const fieldStats = computed(() => {
    if (!props.data.length) return {}

    const stats = {}
    props.data.forEach((row) => {
      if (!row.summary || !Array.isArray(row.summary)) return
      row.summary.forEach(({ key, value }) => {
        if (!stats[key]) {
          stats[key] = {}
        }
        const strValue = String(value)
        if (strValue && strValue !== '-') {
          stats[key][strValue] = (stats[key][strValue] || 0) + 1
        }
      })
    })

    const result = {}
    for (const [field, valueCounts] of Object.entries(stats)) {
      const entries = Object.entries(valueCounts)
        .sort((entrA, entrB) => entrB[1] - entrA[1])
        .slice(0, 5)
      const total = Object.values(valueCounts).reduce((sum, count) => sum + count, 0)
      result[field] = {
        total,
        uniqueCount: Object.keys(valueCounts).length,
        topValues: entries.map(([val, count]) => ({
          value: val,
          count,
          percent: Math.round((count / total) * 100)
        }))
      }
    }

    return result
  })

  const filteredFields = computed(() => {
    const query = searchQuery.value.toLowerCase()
    return props.availableFields.filter(
      (field) => !query || field.value.toLowerCase().includes(query)
    )
  })

  const selectedFieldSet = computed(() => new Set(props.selectedFields))

  const isFieldSelected = (fieldValue) => selectedFieldSet.value.has(fieldValue)

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

      <!-- Available fields -->
      <div class="flex-1 overflow-y-auto">
        <div class="px-3 py-2">
          <span class="text-xs font-medium text-color-secondary uppercase tracking-wide">
            Available
          </span>
        </div>
        <div class="flex flex-col">
          <div
            v-for="field in filteredFields"
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
                  class="flex items-center gap-2 py-0.5"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between text-xs mb-0.5">
                      <span
                        class="truncate text-color cursor-pointer hover:underline"
                        :title="stat.value"
                        @click="handleAddFilter(field.value, stat.value)"
                      >
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
