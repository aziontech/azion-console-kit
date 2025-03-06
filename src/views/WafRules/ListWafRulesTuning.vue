<template>
  <div
    class="border-1 border-bottom-none border-round-top-xl p-3.5 surface-border rounded-md mt-5 rounded-b-none flex flex-col gap-6 md:gap-4"
  >
    <div class="w-full flex md:flex-row flex-col gap-4 md:items-center">
      <div class="flex gap-6 flex-col sm:flex-row w-full">
        <Dropdown
          appendTo="self"
          optionValue="value"
          optionLabel="name"
          :options="timeOptions"
          v-model="selectedFilter.hourRange"
          @change="filterTuning"
          class="w-full sm:max-w-xs"
        />

        <FieldMultiselectLazyLoader
          data-testid="waf-tuning-list__domains-field"
          name="valueDomainId"
          :service="props.listDomainsService"
          :loadService="props.loadDomainService"
          optionLabel="name"
          optionValue="id"
          :value="valueDomainId"
          appendTo="self"
          class="w-full sm:max-w-xs overflow-hidden"
          placeholder="Select domain"
          @onChange="setDomainsSelectedOptions"
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
      </div>
      <div class="flex items-center justify-end">
        <PrimeTag
          class="no-wrap whitespace-nowrap ml-auto"
          :value="recordsFoundLabel"
          severity="info"
        />
      </div>
    </div>
    <div class="flex flex-col md:flex-row md:items-center gap-2">
      <advancedFilter
        ref="advancedFilterRef"
        v-model:externalFilter="selectedFilter"
        v-model:filterAdvanced="selectedFilterAdvanced"
        :fieldsInFilter="listFields"
        @applyFilter="filterSearch"
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
  </div>
  <ListTableBlock
    v-show="showListTable"
    pageTitleDelete="WAF rules tuning"
    :listService="listService"
    ref="listServiceWafTunningRef"
    :columns="wafRulesAllowedColumns"
    :hasListService="true"
    v-model:selectedItensData="selectedEvents"
    :showSelectionMode="true"
    :editInDrawer="openMoreDetails"
    emptyListMessage="No requests found."
    hiddenHeader
    :pt="{ root: { class: 'rounded-t-none p-datatable-hoverable-rows' } }"
  />

  <EmptyResultsBlock
    v-if="!showListTable"
    title="Select a domain to query data"
    description="To use this feature, a domain must be associated with the edge firewall that has a behavior running this WAF rule set."
    :documentationService="props.documentationServiceTuning"
    noShowBorderTop
    class="!mt-0"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Domain"
        @click="goToDomain"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
  <ActionBarTemplate
    v-if="showActionBar"
    @onSubmit="openDialog"
    @onCancel="cancelAllowed"
    :submitDisabled="!selectedEvents.length"
    primaryActionLabel="Allow Rules"
  />

  <MoreDetailsDrawer
    v-if="showDetailsOfAttack"
    :wafRuleId="wafRuleId"
    v-model:visible="showDetailsOfAttack"
    :listService="props.listWafRulesTuningAttacksService"
    :tuningObject="tuningSelected"
    :domains="selectedDomains"
    :time="timeName"
    :listNetworkListService="props.listNetworkListService"
    :loadNetworkListService="props.loadNetworkListService"
    :listCountriesService="props.listCountriesService"
    :parentSelectedFilter="selectedFilter"
    :parentSelectedFilterAdvanced="selectedFilterAdvanced"
    @attack-on="createAllowedByAttack"
  >
  </MoreDetailsDrawer>

  <DialogAllowRule
    v-model:visible="showDialogAllowRule"
    :isLoading="isLoadingAllowed"
    @closeDialog="closeDialog"
    @handleDescriptionOfAttack="handleSubmitAllowRules"
  >
  </DialogAllowRule>
</template>
<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import DialogAllowRule from './Dialog'
  import MoreDetailsDrawer from './Drawer'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import FieldMultiselectLazyLoader from '@/templates/form-fields-inputs/fieldMultiselectLazyLoader'

  import ListTableBlock from '@templates/list-table-block/with-selection-behavior'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'

  import advancedFilter from '@/templates/advanced-filter'
  import { useToast } from 'primevue/usetoast'
  import { computed, onMounted, ref, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import PrimeTag from 'primevue/tag'

  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listWafRulesTuningService: {
      type: Function,
      required: true
    },
    documentationServiceTuning: {
      required: true,
      type: Function
    },
    listCountriesService: {
      required: true,
      type: Function
    },
    listNetworkListService: {
      required: true,
      type: Function
    },
    listWafRulesDomainsService: {
      required: true,
      type: Function
    },
    showActionBar: {
      type: Boolean,
      required: true
    },
    createWafRulesAllowedTuningService: {
      type: Function,
      required: true
    },
    listWafRulesTuningAttacksService: {
      type: Function,
      required: true
    },
    listDomainsService: {
      type: Function,
      required: true
    },
    loadDomainService: {
      type: Function,
      required: true
    },
    loadNetworkListService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const selectedFilter = ref({
    domains: [],
    network: {},
    hourRange: '1'
  })
  const selectedEvents = ref([])
  const totalRecordsFound = ref(0)
  const isLoadingAllowed = ref(null)
  const showDialogAllowRule = ref(false)
  const showDetailsOfAttack = ref(false)
  const wafRuleId = ref(route.params.id)
  const netWorkListOptions = ref({ options: [], done: true })
  const domainsOptions = ref({ options: [], done: true })
  const tuningSelected = ref(null)
  const selectedDomains = ref([])
  const allowedByAttacks = ref([])
  const selectedFilterAdvanced = ref([])
  const listServiceWafTunningRef = ref('')
  const allowRuleOrigin = ref('')

  const valueNetworkId = ref(null)
  const valueDomainId = ref(null)

  const advancedFilterRef = ref(null)

  const recordsFoundLabel = computed(() => {
    return `${totalRecordsFound.value} records found`
  })

  const timeName = computed(
    () => timeOptions.value.find((item) => item.value === selectedFilter.value.hourRange).name
  )

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
    }
  ])

  const timeOptions = ref([
    {
      name: 'Last 1 hour',
      value: '1'
    },
    {
      name: 'Last 3 hours',
      value: '3'
    },
    {
      name: 'Last 6 hours',
      value: '6'
    },
    {
      name: 'Last 12 hours',
      value: '12'
    },
    {
      name: 'Last day',
      value: '24'
    },
    {
      name: 'Last 2 days',
      value: '48'
    },
    {
      name: 'Last 3 days',
      value: '72'
    }
  ])

  const wafRulesAllowedColumns = ref([
    {
      field: 'ruleIdDescription',
      header: 'Rule ID'
    },
    {
      field: 'hitCount',
      header: 'Hits'
    },
    {
      field: 'pathCount',
      header: 'Paths'
    },
    {
      field: 'ipCount',
      header: 'IPs'
    },
    {
      field: 'countryCount',
      header: 'Countries'
    },
    {
      field: 'topIps',
      header: 'Top 10 IP Addresses'
    },
    {
      field: 'topCountries',
      header: 'Top 10 Countries'
    }
  ])

  const showListTable = computed(() => {
    return selectedFilter.value.domains?.length
  })

  const listService = async (params) => {
    const response = await props.listWafRulesTuningService(params)
    totalRecordsFound.value = response.recordsFound
    return response.data
  }

  const setNetworkListSelectedOption = (value) => {
    selectedFilter.value.network = value

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

    const hasIpFilter = selectedFilterAdvanced.value.some(
      (item) => item.valueField === 'ip_address'
    )
    const hasCountryFilter = selectedFilterAdvanced.value.some(
      (item) => item.valueField === 'country'
    )

    if (value?.value?.disabledIP) {
      const validFilters = selectedFilterAdvanced.value.filter(
        (item) => item.valueField !== 'ip_address'
      )
      advancedFilterRef.value?.clearSpecificFilter('ip_address')
      selectedFilterAdvanced.value = validFilters

      if (hasIpFilter) {
        toast.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'The ip addres field cannot be used together with an IP/CIDR Network List filter.'
        })
      }
    }

    if (value?.value?.disabledCountries) {
      const validFilters = selectedFilterAdvanced.value.filter(
        (item) => item.valueField !== 'country'
      )
      advancedFilterRef.value?.clearSpecificFilter('country')
      selectedFilterAdvanced.value = validFilters

      if (hasCountryFilter) {
        toast.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'The country field cannot be used together with a Country Network List filter.'
        })
      }
    }

    filterTuning()
  }

  const setDomainsSelectedOptions = (value) => {
    selectedDomains.value = value
    selectedFilter.value.domains = value
    filterTuning()
  }

  const downloadCSV = () => {
    listServiceWafTunningRef.value?.handleExportTableDataToCSV()
  }

  const showToast = (summary, severity) => {
    return toast.add({
      severity,
      summary: severity,
      detail: summary,
      closable: true
    })
  }

  const openDialog = (origin = 'page') => {
    showDialogAllowRule.value = true
    allowRuleOrigin.value = origin
    tracker.wafRules.clickedToAllowRules({ origin }).track()
  }

  const cancelAllowed = () => {
    selectedEvents.value = []
  }

  const closeDialog = () => {
    isLoadingAllowed.value = null
    showDialogAllowRule.value = false
    allowedByAttacks.value = []
  }

  const openMoreDetails = (tuning) => {
    tuningSelected.value = tuning
    showDetailsOfAttack.value = true
  }

  const goToDomain = () => {
    router.push({ name: 'list-domains' })
  }

  const handleSubmitAllowRules = async (nameAttack) => {
    let attackEvents = []
    if (allowedByAttacks.value.length) {
      attackEvents = [...allowedByAttacks.value]
    } else if (selectedEvents.value.length) {
      attackEvents = [...selectedEvents.value]
    }

    try {
      const [{ status, reason, value }] = await props.createWafRulesAllowedTuningService({
        attackEvents,
        wafId: wafRuleId.value,
        name: nameAttack
      })

      if (status === 'rejected') {
        throw new Error(reason)
      }

      showToast(value, 'success')
      filterSearch()
      closeDialog()
      selectedEvents.value = []
      allowedByAttacks.value = []
      showDetailsOfAttack.value = false
      handleTrackAllowRule()
    } catch (error) {
      let errorMessage = error?.message || error

      handleTrackFailedToAllowRules(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      isLoadingAllowed.value = false
    }
  }

  const handleTrackFailedToAllowRules = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.wafRules
      .failedToAllowRules({
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message,
        origin: allowRuleOrigin.value
      })
      .track()
  }

  const handleTrackAllowRule = () => {
    tracker.wafRules.allowedRules({ origin: allowRuleOrigin.value }).track()
  }

  const createAllowedByAttack = (value) => {
    openDialog('drawer')
    allowedByAttacks.value = value
  }

  const filterTuning = async () => {
    filterSearch(selectedFilterAdvanced.value)
  }

  const filterSearch = async (filter) => {
    if (!selectedFilter.value.domains.length) return

    tracker.product.clickedOn({ target: 'Search' }).track()

    const queryFields = {
      wafId: wafRuleId.value,
      domains: selectedFilter.value.domains,
      hourRange: selectedFilter.value.hourRange,
      network: selectedFilter.value.network?.id,
      filter
    }

    listServiceWafTunningRef.value.reload(queryFields)
  }

  const setNetWorkListOptions = async () => {
    try {
      const response = await props.listNetworkListService({ fields: '' })
      netWorkListOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      netWorkListOptions.value.done = false
    }
  }

  const setDomainsOptions = async () => {
    try {
      const response = await props.listDomainsService({ fields: 'id,name,active' })
      domainsOptions.value.options = response.body
    } catch (error) {
      showToast(error, 'error')
    } finally {
      domainsOptions.value.done = false
    }
  }

  onMounted(async () => {
    await setNetWorkListOptions()
    await setDomainsOptions()
  })
</script>
