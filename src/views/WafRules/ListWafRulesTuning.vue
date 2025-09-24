<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import DialogAllowRule from './Dialog'
  import MoreDetailsDrawer from './Drawer'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'

  import ListTableBlock from '@templates/list-table-block/with-selection-behavior'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import MultiSelect from 'primevue/multiselect'

  import advancedFilter from '@/templates/advanced-filter'
  import { useToast } from 'primevue/usetoast'
  import { computed, onMounted, ref, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import PrimeTag from 'primevue/tag'
  import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'
  import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
  import { wafService } from '@/services/v2/waf/waf-service'

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()

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
    listWafRulesDomainsService: {
      required: true,
      type: Function
    },
    showActionBar: {
      type: Boolean,
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
  const selectedDomainsNames = ref([])
  const isLoadingAllowed = ref(null)
  const showDialogAllowRule = ref(false)
  const showDetailsOfAttack = ref(false)
  const wafRuleId = ref(route.params.id)
  const netWorkListOptions = ref({ options: [], done: true })
  const domainsOptions = ref({ options: [], done: false })
  const tuningSelected = ref(null)
  const allowedByAttacks = ref([])
  const selectedFilterAdvanced = ref([])
  const listServiceWafTunningRef = ref('')
  const allowRuleOrigin = ref('')

  const valueNetworkId = ref(null)
  const selectedDomainIds = ref([])

  const advancedFilterRef = ref(null)

  const recordsFoundLabel = computed(() => {
    return `${totalRecordsFound.value} records found`
  })

  const parsedDomainsNames = computed(() => {
    return selectedDomainsNames.value.join(', ')
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

    const displayFilters = advancedFilterRef.value?.displayFilter || []

    const hasIpFilter = displayFilters.some(
      (item) => item.valueField === 'ip_address' && item.value && item.value !== ''
    )

    const hasCountryFilter = displayFilters.some(
      (item) => item.valueField === 'country' && Array.isArray(item.value) && item.value.length > 0
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

  const setDomainsSelectedOptions = () => {
    selectedDomainsNames.value = domainsOptions.value.options
      .filter((item) => selectedDomainIds.value.includes(item.id))
      .map((domain) => domain.name)
    selectedFilter.value.domains = selectedDomainIds.value || []
    filterTuning()
  }

  const downloadCSV = () => {
    listServiceWafTunningRef.value?.handleExportTableDataToCSV()
  }

  const showToast = (detail, summary, severity) => {
    return toast.add({
      severity,
      summary,
      detail,
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
    router.push({ name: `list-${handleTextDomainWorkload.pluralLabel}` })
  }

  const handleSubmitAllowRules = async (nameAttack) => {
    let attackEvents = []
    if (allowedByAttacks.value.length) {
      attackEvents = [...allowedByAttacks.value]
    } else if (selectedEvents.value.length) {
      attackEvents = [...selectedEvents.value]
    }

    try {
      const [{ status, reason, value }] = await wafService.createWafRulesAllowedTuning({
        attackEvents,
        wafId: wafRuleId.value,
        name: nameAttack
      })

      if (status === 'rejected') {
        throw new Error(reason.message || reason)
      }

      showToast(value.feedback, 'Success', 'success')
      filterSearch()
      closeDialog()
      selectedEvents.value = []
      allowedByAttacks.value = []
      showDetailsOfAttack.value = false
      handleTrackAllowRule()
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        const errorMessage = error?.message || error
        showToast(errorMessage, 'Error', 'error')
        handleTrackFailedToAllowRules(errorMessage)
      }
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
    if (!selectedFilter.value.domains.length) {
      totalRecordsFound.value = 0
      return
    }

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
      const response = await networkListsService.listNetworkLists({ fields: '', isDropdown: true })
      netWorkListOptions.value.options = response
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        const errorMessage = error?.message || error
        showToast(errorMessage, 'error', 'error')
      }
    } finally {
      netWorkListOptions.value.done = false
    }
  }

  const listDomainsOptions = async () => {
    try {
      domainsOptions.value.done = false

      const domains = await props.listDomainsService({ wafId: wafRuleId.value })

      domainsOptions.value.options = domains
    } finally {
      domainsOptions.value.done = true
    }
  }

  const handleListNetworkListDropdown = async ({ id }) => {
    return await networkListsService.listNetworkLists({ id }, true)
  }

  const handleLoadNetworkListDropdown = async ({ id }) => {
    return await networkListsService.loadNetworkList({ id }, true)
  }

  onMounted(async () => {
    await setNetWorkListOptions()
    await listDomainsOptions()
  })
</script>

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
        <MultiSelect
          data-testid="waf-tuning-list__domains-field"
          appendTo="body"
          optionLabel="name"
          optionValue="id"
          :options="domainsOptions.options"
          :loading="!domainsOptions.done"
          v-model="selectedDomainIds"
          @change="setDomainsSelectedOptions"
          class="w-full sm:max-w-xs"
          :placeholder="`Select a ${handleTextDomainWorkload.singularLabel}`"
          filter
          display="chip"
          scrollHeight="250px"
          :maxSelectedLabels="3"
          :virtualScrollerOptions="{ itemSize: 38 }"
          :pt="{
            panel: { class: 'surface-section shadow-2 border-none' },
            item: {
              class: 'hover:surface-hover',
              'data-testid': 'waf-tuning-list__domains-field-item'
            },
            closeButton: { 'data-testid': 'waf-tuning-list__domains-field-close-button' },
            wrapper: { class: 'w-full' },
            list: { class: 'p-0 list-none' },
            filterInput: { class: 'surface-ground' }
          }"
          style="--p-multiselect-overlay-width: 100%"
        />

        <FieldDropdownLazyLoader
          data-testid="waf-tuning-list__network-list-field"
          name="valueNetworkId"
          :service="handleListNetworkListDropdown"
          :loadService="handleLoadNetworkListDropdown"
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
        :hashUpdatable="false"
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
    :title="`Select a ${handleTextDomainWorkload.singularLabel} to query data`"
    :description="`To use this feature, a ${handleTextDomainWorkload.singularLabel} must be associated with the Firewall that has a behavior running this WAF rule set.`"
    :documentationService="props.documentationServiceTuning"
    noShowBorderTop
    class="!mt-0"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        :label="`${handleTextDomainWorkload.singularTitle}`"
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
    :domainNames="parsedDomainsNames"
    v-model:visible="showDetailsOfAttack"
    :listService="props.listWafRulesTuningAttacksService"
    :tuningObject="tuningSelected"
    :domains="selectedFilter.domains"
    :time="timeName"
    :listNetworkListService="handleListNetworkListDropdown"
    :loadNetworkListService="handleLoadNetworkListDropdown"
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
