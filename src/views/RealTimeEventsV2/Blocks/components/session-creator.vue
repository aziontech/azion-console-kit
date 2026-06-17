<script setup>
  import { ref, computed, watch } from 'vue'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import InputText from '@aziontech/webkit/inputtext'
  import Textarea from '@aziontech/webkit/textarea'
  import PrimeButton from '@aziontech/webkit/button'
  import Checkbox from '@aziontech/webkit/checkbox'
  import Dropdown from '@aziontech/webkit/dropdown'
  import TABS_EVENTS from '../constants/tabs-events'

  defineOptions({ name: 'SessionCreator' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    panelConfig: {
      type: Object,
      default: null
    },
    availableReports: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits(['update:visible', 'save'])

  const NAME_MAX_LENGTH = 50
  const DESCRIPTION_MAX_LENGTH = 120

  // Only timeseries (line) and histogram (ordered-bar) chart types are allowed.
  // Other chart types (big-numbers, list, map, pie) are omitted so the panel
  // always surfaces chart families that are comparable side-by-side.
  const ALLOWED_CHART_TYPES = ['line', 'ordered-bar']

  const CHART_TYPE_META = {
    line: { label: 'Timeseries', icon: 'pi pi-chart-line' },
    'ordered-bar': { label: 'Histogram', icon: 'pi pi-chart-bar' }
  }

  const ICON_OPTIONS = [
    'pi pi-shield',
    'pi pi-chart-line',
    'pi pi-code',
    'pi pi-globe',
    'pi pi-server',
    'pi pi-database',
    'pi pi-bolt',
    'pi pi-eye',
    'pi pi-lock',
    'pi pi-chart-bar',
    'pi pi-cog',
    'pi pi-filter',
    'pi pi-search',
    'pi pi-bookmark',
    'pi pi-star'
  ]

  const name = ref('')
  const description = ref('')
  const selectedIcon = ref('pi pi-chart-bar')
  const selectedCharts = ref([])
  const selectedDataset = ref(null)
  const defaultFilters = ref([])
  const chartsSearch = ref('')
  const nameError = ref('')
  const chartsError = ref('')

  const datasetOptions = computed(() => {
    return Object.values(TABS_EVENTS).map((tab) => ({
      label: tab.title,
      value: tab.dataset
    }))
  })

  const isEditMode = computed(() => props.panelConfig !== null)

  const dialogTitle = computed(() => (isEditMode.value ? 'Edit session' : 'Create session'))

  const visibleDialog = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  // Reports filtered by allowed chart types.
  const allowedReports = computed(() => {
    return props.availableReports.filter((report) => ALLOWED_CHART_TYPES.includes(report.type))
  })

  // Apply the free-text search filter over label + description.
  const filteredReports = computed(() => {
    const query = chartsSearch.value.trim().toLowerCase()
    if (!query) return allowedReports.value
    return allowedReports.value.filter((report) => {
      const haystack = `${report.label || ''} ${report.description || ''}`.toLowerCase()
      return haystack.includes(query)
    })
  })

  const reportsByCategory = computed(() => {
    const categories = {}
    filteredReports.value.forEach((report) => {
      const category = report.dashboardId || 'other'
      if (!categories[category]) {
        categories[category] = {
          key: category,
          label: getCategoryLabel(report),
          reports: []
        }
      }
      categories[category].reports.push(report)
    })
    return Object.values(categories)
  })

  function getCategoryLabel(report) {
    const datasetLabels = {
      httpMetrics: 'Edge Applications',
      edgeFunctionsMetrics: 'Edge Functions',
      l2CacheMetrics: 'Tiered Cache',
      imagesProcessedMetrics: 'Image Processor',
      idnsQueriesMetrics: 'Edge DNS',
      dataStreamedMetrics: 'Data Stream',
      httpBreakdownMetrics: 'Threats Breakdown',
      botManagerMetrics: 'Bot Manager',
      botManagerBreakdownMetrics: 'Bot Manager Breakdown'
    }
    return datasetLabels[report.dataset] || report.dataset || 'Other'
  }

  const chartTypeMeta = (report) => CHART_TYPE_META[report.type] || null

  const isChartSelected = (reportId) => {
    return selectedCharts.value.includes(reportId)
  }

  const toggleChart = (reportId) => {
    const index = selectedCharts.value.indexOf(reportId)
    if (index === -1) {
      selectedCharts.value.push(reportId)
    } else {
      selectedCharts.value.splice(index, 1)
    }
    chartsError.value = ''
  }

  // Select/deselect every report inside one category, respecting current filter.
  const isCategoryFullySelected = (category) => {
    if (!category.reports.length) return false
    return category.reports.every((report) => selectedCharts.value.includes(report.id))
  }

  const toggleCategory = (category) => {
    const allSelected = isCategoryFullySelected(category)
    if (allSelected) {
      const idsToRemove = new Set(category.reports.map((report) => report.id))
      selectedCharts.value = selectedCharts.value.filter((id) => !idsToRemove.has(id))
    } else {
      const merged = new Set(selectedCharts.value)
      category.reports.forEach((report) => merged.add(report.id))
      selectedCharts.value = Array.from(merged)
    }
    chartsError.value = ''
  }

  const validateForm = () => {
    let isValid = true

    if (!name.value.trim()) {
      nameError.value = 'Name is required'
      isValid = false
    } else if (name.value.trim().length > NAME_MAX_LENGTH) {
      nameError.value = `Name must be ${NAME_MAX_LENGTH} characters or less`
      isValid = false
    } else {
      nameError.value = ''
    }

    if (selectedCharts.value.length === 0 && !selectedDataset.value) {
      chartsError.value = 'Select at least one chart or a dataset'
      isValid = false
    } else {
      chartsError.value = ''
    }

    return isValid
  }

  const generateId = () => {
    return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  }

  // When description is omitted, fall back to the legacy auto-generated copy.
  const resolveDescription = (trimmedName) => {
    const typed = description.value.trim()
    return typed || `Custom session: ${trimmedName}`
  }

  // Derive the unique list of Metrics dashboard IDs touched by the selected
  // reports. DashboardPanel uses this to populate the Metrics dashboard
  // dropdown and render the timeseries/histogram charts via the Metrics
  // pipeline. Without it, custom sessions would render empty.
  const resolveMetricsDashboardIds = () => {
    const reportsById = new Map(props.availableReports.map((report) => [report.id, report]))
    const dashboardIds = new Set()
    selectedCharts.value.forEach((reportId) => {
      const report = reportsById.get(reportId)
      if (report?.dashboardId) dashboardIds.add(report.dashboardId)
    })
    return Array.from(dashboardIds)
  }

  const handleSave = () => {
    if (!validateForm()) return

    const trimmedName = name.value.trim()
    const config = {
      id: isEditMode.value ? props.panelConfig.id : generateId(),
      label: trimmedName,
      icon: selectedIcon.value,
      description: resolveDescription(trimmedName),
      type: 'custom',
      charts: selectedCharts.value.map((reportId) => ({ reportId })),
      metricsDashboardIds: resolveMetricsDashboardIds(),
      eventsConfig: selectedDataset.value
        ? {
            dataset: selectedDataset.value,
            defaultFilters: defaultFilters.value,
            defaultSelectedFields: []
          }
        : null,
      colorScheme: {
        primary: 'var(--primary-color)',
        secondary: 'var(--text-color-secondary)'
      }
    }

    emit('save', config)
    emit('update:visible', false)
  }

  const resetForm = () => {
    name.value = ''
    description.value = ''
    selectedIcon.value = 'pi pi-chart-bar'
    selectedCharts.value = []
    selectedDataset.value = null
    defaultFilters.value = []
    chartsSearch.value = ''
    nameError.value = ''
    chartsError.value = ''
  }

  const prefillForm = () => {
    if (!props.panelConfig) return
    name.value = props.panelConfig.label || ''
    // Preserve custom descriptions; hide the legacy auto-generated one so the
    // placeholder/fallback is applied again if the user doesn't type anything.
    const rawDescription = props.panelConfig.description || ''
    description.value = rawDescription.startsWith('Custom session: ') ? '' : rawDescription
    selectedIcon.value = props.panelConfig.icon || 'pi pi-chart-bar'
    selectedCharts.value = (props.panelConfig.charts || []).map((chart) => chart.reportId)
    selectedDataset.value = props.panelConfig.eventsConfig?.dataset || null
    defaultFilters.value = props.panelConfig.eventsConfig?.defaultFilters || []
    chartsSearch.value = ''
  }

  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        if (isEditMode.value) {
          prefillForm()
        } else {
          resetForm()
        }
      }
    }
  )
</script>

<template>
  <PrimeDialog
    v-model:visible="visibleDialog"
    modal
    :header="dialogTitle"
    :style="{ width: '40rem', maxWidth: '90vw' }"
    :closable="true"
    data-testid="session-creator-dialog"
  >
    <div class="flex flex-col gap-5">
      <!-- Name field -->
      <div class="flex flex-col gap-2">
        <label
          for="session-name"
          class="text-sm font-medium text-color"
        >
          Name
        </label>
        <InputText
          id="session-name"
          v-model="name"
          :maxlength="NAME_MAX_LENGTH"
          placeholder="Session name"
          class="w-full"
          :class="{ 'p-invalid': nameError }"
          data-testid="session-creator-name"
        />
        <small
          v-if="nameError"
          class="text-red-500 text-xs"
          data-testid="session-creator-name-error"
        >
          {{ nameError }}
        </small>
        <small class="text-color-secondary text-xs">
          {{ name.length }}/{{ NAME_MAX_LENGTH }} characters
        </small>
      </div>

      <!-- Description field -->
      <div class="flex flex-col gap-2">
        <label
          for="session-description"
          class="text-sm font-medium text-color"
        >
          Description
          <span class="text-color-secondary font-normal">(optional)</span>
        </label>
        <Textarea
          id="session-description"
          v-model="description"
          :maxlength="DESCRIPTION_MAX_LENGTH"
          placeholder="Describe the purpose of this session"
          rows="2"
          autoResize
          class="w-full"
          data-testid="session-creator-description"
        />
        <small class="text-color-secondary text-xs">
          {{ description.length }}/{{ DESCRIPTION_MAX_LENGTH }} characters · Defaults to
          <em>"Custom session: {name}"</em> when left blank
        </small>
      </div>

      <!-- Icon selector -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-color">Icon</label>
        <div
          class="flex flex-wrap gap-2"
          data-testid="session-creator-icon-selector"
        >
          <button
            v-for="icon in ICON_OPTIONS"
            :key="icon"
            type="button"
            class="session-creator__icon-btn"
            :class="{ 'session-creator__icon-btn--active': selectedIcon === icon }"
            :data-testid="`icon-option-${icon.replace(/\s/g, '-')}`"
            @click="selectedIcon = icon"
          >
            <i
              :class="icon"
              class="text-base"
            />
          </button>
        </div>
      </div>

      <!-- Charts grouped by category -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <label class="text-sm font-medium text-color">
            Charts
            <span class="text-color-secondary font-normal">
              · {{ selectedCharts.length }} selected
            </span>
          </label>
          <span class="text-xs text-color-secondary"> Timeseries &amp; histograms only </span>
        </div>
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText
            v-model="chartsSearch"
            placeholder="Search charts by name or description"
            class="w-full"
            data-testid="session-creator-charts-search"
          />
        </span>
        <div
          class="flex flex-col gap-3 max-h-72 overflow-y-auto border surface-border rounded p-3"
          data-testid="session-creator-charts"
        >
          <div
            v-for="category in reportsByCategory"
            :key="category.key"
            class="flex flex-col gap-1"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-medium text-color-secondary uppercase tracking-wide">
                {{ category.label }}
              </span>
              <button
                type="button"
                class="text-xs font-medium session-creator__category-toggle"
                :data-testid="`category-toggle-${category.key}`"
                @click="toggleCategory(category)"
              >
                {{ isCategoryFullySelected(category) ? 'Clear all' : 'Select all' }}
              </button>
            </div>
            <div class="flex flex-col gap-0.5 mt-1">
              <label
                v-for="report in category.reports"
                :key="report.id"
                :for="`chart-${report.id}`"
                class="session-creator__chart-row"
                :class="{ 'session-creator__chart-row--selected': isChartSelected(report.id) }"
              >
                <Checkbox
                  :modelValue="isChartSelected(report.id)"
                  :binary="true"
                  :inputId="`chart-${report.id}`"
                  :data-testid="`chart-checkbox-${report.id}`"
                  @update:modelValue="toggleChart(report.id)"
                />
                <div class="flex flex-col min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-color truncate">{{ report.label }}</span>
                    <span
                      v-if="chartTypeMeta(report)"
                      class="session-creator__type-badge"
                      :title="chartTypeMeta(report).label"
                    >
                      <i :class="chartTypeMeta(report).icon" />
                      {{ chartTypeMeta(report).label }}
                    </span>
                  </div>
                  <span
                    v-if="report.description"
                    class="text-xs text-color-secondary truncate"
                    :title="report.description"
                  >
                    {{ report.description }}
                  </span>
                </div>
              </label>
            </div>
          </div>
          <div
            v-if="!reportsByCategory.length"
            class="text-sm text-color-secondary text-center py-4"
          >
            <i class="pi pi-inbox block text-2xl mb-2" />
            {{ chartsSearch ? 'No charts match your search.' : 'No charts available.' }}
          </div>
        </div>
        <small
          v-if="chartsError"
          class="text-red-500 text-xs"
          data-testid="session-creator-charts-error"
        >
          {{ chartsError }}
        </small>
      </div>

      <!-- Dataset selector -->
      <div class="flex flex-col gap-2">
        <label
          for="session-dataset"
          class="text-sm font-medium text-color"
        >
          Events Dataset
        </label>
        <Dropdown
          id="session-dataset"
          v-model="selectedDataset"
          :options="datasetOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select a dataset"
          class="w-full"
          :showClear="true"
          data-testid="session-creator-dataset"
        />
      </div>

      <!-- Action buttons -->
      <div class="flex justify-end gap-2 pt-2 border-t surface-border">
        <PrimeButton
          label="Cancel"
          text
          data-testid="session-creator-cancel"
          @click="visibleDialog = false"
        />
        <PrimeButton
          :label="isEditMode ? 'Save changes' : 'Create session'"
          data-testid="session-creator-save"
          @click="handleSave"
        />
      </div>
    </div>
  </PrimeDialog>
</template>

<style scoped>
  .session-creator__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.375rem;
    border: 1px solid var(--surface-border);
    background: var(--surface-card);
    color: var(--text-color-secondary);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .session-creator__icon-btn:hover {
    background-color: var(--surface-hover);
  }

  .session-creator__icon-btn--active {
    background-color: var(--highlight-bg);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .session-creator__chart-row {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .session-creator__chart-row:hover {
    background-color: var(--surface-hover);
  }

  .session-creator__chart-row--selected {
    background-color: var(--highlight-bg);
  }

  .session-creator__type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.0625rem 0.375rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 500;
    background-color: var(--surface-section);
    color: var(--text-color-secondary);
    border: 1px solid var(--surface-border);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .session-creator__type-badge i {
    font-size: 0.625rem;
  }

  .session-creator__category-toggle {
    background: transparent;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    padding: 0;
  }

  .session-creator__category-toggle:hover {
    text-decoration: underline;
  }
</style>
