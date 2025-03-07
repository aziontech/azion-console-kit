<script setup>
  import { computed, onBeforeMount, ref, nextTick } from 'vue'
  import ActionBarBlock from '@/templates/action-bar-block'
  import Divider from 'primevue/divider'
  import GoBack from '@/templates/action-bar-block/go-back'
  import EmptyDrawer from '@/templates/empty-drawer'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import WithSelectionBehavior from '@/templates/list-table-block/with-selection-behavior.vue'
  import advancedFilter from '@/templates/advanced-filter'
  import Dropdown from 'primevue/dropdown'
  import PrimeTag from 'primevue/tag'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import { useToast } from 'primevue/usetoast'
  import PrimeButton from 'primevue/button'

  defineOptions({
    name: 'more-details'
  })

  const emit = defineEmits(['update:visible', 'attack-on'])
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    listService: {
      type: Function,
      required: true
    },
    domains: {
      type: Array,
      required: true
    },
    domainNames: {
      type: Array,
      required: true
    },
    listCountriesService: {
      type: Function,
      required: true
    },
    time: {
      type: String,
      default: '',
      required: true
    },
    wafRuleId: {
      type: String,
      required: true
    },
    tuningObject: {
      type: Object,
      default: () => {},
      required: true
    },
    parentSelectedFilter: {
      type: Object,
      required: true
    },
    parentSelectedFilterAdvanced: {
      type: Object,
      required: true
    },
    listNetworkListService: {
      type: Function,
      required: true
    },
    loadNetworkListService: {
      type: Function,
      required: true
    }
  })

  const showGoBack = ref(false)
  const selectedAttack = ref([])
  const selectedFilter = ref({
    hourRange: '1'
  })

  const selectedFilterAdvanced = ref([])
  const totalRecordsFound = ref(0)
  const listTableRef = ref(null)

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const recordsFoundLabel = computed(() => {
    return `${totalRecordsFound.value} records found`
  })

  const timeOptions = ref([
    { name: 'Last 1 hour', value: '1' },
    { name: 'Last 3 hours', value: '3' },
    { name: 'Last 6 hours', value: '6' },
    { name: 'Last 12 hours', value: '12' },
    { name: 'Last day', value: '24' },
    { name: 'Last 2 days', value: '48' },
    { name: 'Last 3 days', value: '72' }
  ])

  const valueNetworkId = ref(null)

  const listFields = ref([
    {
      label: 'Country',
      value: 'country',
      description: '',
      operator: [
        {
          value: 'In',
          type: 'ArrayObject',
          props: {
            placeholder: 'Select Country',
            services: props.listCountriesService,
            payload: { label: 'name', value: 'value' }
          }
        }
      ]
    },
    {
      label: 'IP Address',
      value: 'ip_address',
      description: '',
      operator: [
        { value: 'Eq', type: 'String', props: { placeholder: 'Select IP Address' } },
        { value: 'In', type: 'ArrayString', props: { placeholder: 'Enter IP Address' } }
      ]
    },
    {
      label: 'Path',
      value: 'pathsList',
      description: '',
      operator: [{ value: 'Eq', type: 'String', props: { placeholder: 'Enter Path' } }]
    }
  ])

  const toast = useToast()
  const advancedFilterRef = ref(null)

  const setNetworkListSelectedOption = (value) => {
    selectedFilter.value.network = value

    const displayFilters = advancedFilterRef.value?.displayFilter || []

    const hasIpFilter = displayFilters.some(
      (item) => item.valueField === 'ip_address' && item.value && item.value !== ''
    )

    const hasCountryFilter = displayFilters.some(
      (item) => item.valueField === 'country' && Array.isArray(item.value) && item.value.length > 0
    )

    listFields.value = listFields.value.map((item) => {
      if (item.value === 'ip_address') {
        return {
          ...item,
          networkListDisabled: value?.value?.disabledIP,
          disabled: value?.value?.disabledIP
        }
      }
      if (item.value === 'country') {
        return {
          ...item,
          networkListDisabled: value?.value?.disabledCountries,
          disabled: value?.value?.disabledCountries
        }
      }
      return item
    })

    if (value?.value?.disabledIP && hasIpFilter) {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'The ip address field cannot be used together with an IP/CIDR Network List filter.'
      })
      advancedFilterRef.value?.clearSpecificFilter('ip_address')
    }

    if (value?.value?.disabledCountries && hasCountryFilter) {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'The country field cannot be used together with a Country Network List filter.'
      })
      advancedFilterRef.value?.clearSpecificFilter('country')
    }

    filterTuning()
  }

  const filterSearch = async (filter) => {
    const query = {
      hourRange: selectedFilter.value.hourRange,
      matchesOn: props.tuningObject.matchesOn,
      matchZone: props.tuningObject.matchZone,
      network: selectedFilter.value.network?.id,
      ipsList: filter.filter((item) => item.valueField === 'ip_address')[0]?.value,
      countries: filter
        .filter((item) => item.valueField === 'country')[0]
        ?.value.map((country) => country.name)
        .join(','),
      pathsList: filter.filter((item) => item.valueField === 'pathsList')[0]?.value
    }
    listTableRef.value?.reload({ filters: query })
  }

  const listAttacks = async (params) => {
    let query

    if (!params.filters) {
      const hourRange = selectedFilter.value.hourRange
      query = {
        hourRange: hourRange,
        matchesOn: props.tuningObject.matchesOn,
        matchZone: props.tuningObject.matchZone,
        ipsList: selectedFilterAdvanced.value.filter((item) => item.valueField === 'ip_address')[0]
          ?.value,
        countries: selectedFilterAdvanced.value
          .filter((item) => item.valueField === 'country')[0]
          ?.value.map((country) => country.name)
          .join(','),
        pathsList: selectedFilterAdvanced.value.filter((item) => item.valueField === 'pathsList')[0]
          ?.value,
        network: selectedFilter.value.network?.id
      }
    } else {
      query = params.filters
    }
    query.domains = encodeURIComponent(props.domains.join(','))
    const response = await props.listService({
      wafId: props.wafRuleId,
      tuningId: props.tuningObject.id,
      query: query
    })
    totalRecordsFound.value = response.length
    return response
  }

  const filterTuning = async () => {
    filterSearch(selectedFilterAdvanced.value)
  }

  const toggleDrawerVisibility = (isVisible) => {
    visibleDrawer.value = isVisible
  }

  const closeDrawer = () => {
    toggleDrawerVisibility(false)
  }

  const handleGoBack = () => {
    showGoBack.value = false
    toggleDrawerVisibility(false)
  }

  const createAllowed = () => {
    emit('attack-on', selectedAttack.value)
  }

  const tableColumns = [
    {
      field: 'matchValue',
      header: 'Field',
      sortable: true
    },
    {
      field: 'hitCount',
      header: 'Total Hits',
      sortable: true
    },
    {
      field: 'ipCount',
      header: 'Total IPs',
      sortable: true
    },
    {
      field: 'countryCount',
      header: 'Total Countries',
      sortable: true
    },
    {
      field: 'topIps',
      header: 'Top 10 IPs',
      sortable: true,
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    },
    {
      field: 'topCountries',
      header: 'Top 10 Countries',
      sortable: true,
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    },
    {
      field: 'topPaths',
      header: 'Top 10 Paths',
      sortable: true,
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    }
  ]

  const downloadCSV = () => {
    listTableRef.value?.handleExportTableDataToCSV()
  }

  onBeforeMount(() => {
    valueNetworkId.value = props.parentSelectedFilter.network?.id
    selectedFilter.value = props.parentSelectedFilter
    const { disabledIP, disabledCountries } = selectedFilter.value.network?.value || {}
    listFields.value.find((item) => item.value === 'ip_address').disabled = disabledIP
    listFields.value.find((item) => item.value === 'ip_address').networkListDisabled = disabledIP
    listFields.value.find((item) => item.value === 'country').disabled = disabledCountries
    listFields.value.find((item) => item.value === 'country').networkListDisabled =
      disabledCountries

    selectedFilterAdvanced.value = props.parentSelectedFilterAdvanced
    nextTick(() => {
      if (advancedFilterRef.value) {
        advancedFilterRef.value.updateDisplayFilter(props.parentSelectedFilterAdvanced)
        advancedFilterRef.value.searchFilter()
      }
    })
  })
</script>

<template>
  <EmptyDrawer
    v-model:visible="visibleDrawer"
    title="More Details"
    expandable
    expandedDefault
  >
    <template #content>
      <div class="flex flex-col w-full">
        <div class="flex flex-col p-0 gap-6 sm:gap-8">
          <div
            class="flex max-w-screen-2xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
          >
            <div class="flex-col justify-center items-start gap-3 flex">
              <div class="text-color text-xl font-medium">
                {{ tuningObject.ruleIdDescription }}
              </div>
              <div class="justify-start items-center gap-1 inline-flex">
                <i class="pi pi-calendar text-color"></i>
                <span class="text-color-secondary">{{ time }}</span>
              </div>
            </div>
            <Divider></Divider>
            <div class="flex gap-2">
              <span class="text-color font-medium">Domains:</span>
              <span class="text-color-secondary">{{ props.domainNames }}</span>
            </div>
          </div>
          <div
            class="flex max-w-screen-2xl mx-auto gap-8 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
          >
            <div class="flex-col gap-8 flex w-full">
              <div class="gap-2 flex flex-col">
                <div class="text-color text-xl font-medium">Possible Attacks List</div>
                <div class="text-color-secondary items-center gap-1 inline-flex">
                  Select fields to create allowed rules in the WAF.
                </div>
              </div>

              <div class="flex flex-col md:flex-row gap-4 w-full">
                <Dropdown
                  appendTo="self"
                  optionValue="value"
                  optionLabel="name"
                  :options="timeOptions"
                  v-model="selectedFilter.hourRange"
                  @change="filterTuning"
                  class="w-full sm:max-w-xs"
                />
                <FieldDropdownLazyLoader
                  data-testid="waf-tuning-list__network-list-field"
                  name="valueNetworkId"
                  :service="props.listNetworkListService"
                  :loadService="props.loadNetworkListService"
                  optionLabel="name"
                  optionValue="id"
                  :value="valueNetworkId"
                  :moreOptions="['value']"
                  appendTo="self"
                  placeholder="Select an network list"
                  @onClear="setNetworkListSelectedOption(null)"
                  @onSelectOption="setNetworkListSelectedOption"
                  class="w-full sm:max-w-xs"
                  enableClearOption
                />
                <div class="flex items-center ml-auto">
                  <PrimeTag
                    class="no-wrap whitespace-nowrap ml-auto"
                    :value="recordsFoundLabel"
                    severity="info"
                  />
                </div>
              </div>

              <div class="flex flex-col md:flex-row md:items-center gap-2">
                <advancedFilter
                  v-model:externalFilter="selectedFilter"
                  v-model:filterAdvanced="selectedFilterAdvanced"
                  :hashUpdatable="false"
                  :fieldsInFilter="listFields"
                  @applyFilter="filterSearch"
                  ref="advancedFilterRef"
                />
                <PrimeButton
                  class="md:hidden"
                  outlined
                  size="small"
                  label="Export to CSV"
                  icon="pi pi-download"
                  @click="downloadCSV"
                />
                <PrimeButton
                  class="hidden md:flex"
                  outlined
                  size="small"
                  icon="pi pi-download"
                  v-tooltip.bottom="{ value: 'Export to CSV', showDelay: 200 }"
                  @click="downloadCSV"
                />
              </div>

              <WithSelectionBehavior
                ref="listTableRef"
                v-model:selectedItensData="selectedAttack"
                :columns="tableColumns"
                :listService="listAttacks"
                :hasListService="true"
                hiddenHeader
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="sticky bottom-0">
        <GoBack
          :goBack="handleGoBack"
          v-if="showGoBack"
          :inDrawer="true"
        />
        <ActionBarBlock
          v-else
          @onCancel="closeDrawer"
          @onSubmit="createAllowed"
          :inDrawer="true"
          primaryActionLabel="Allow Rules"
          :submitDisabled="!selectedAttack.length"
        />
      </div>
    </template>
  </EmptyDrawer>
</template>
