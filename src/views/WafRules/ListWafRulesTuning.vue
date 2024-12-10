<template>
  <div class="flex gap-6 mt-4 flex-col sm:flex-row">
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
      placeholder="Select domain"
      resetFilterOnHide
      autoFilterFocus
      optionValue="id"
      optionLabel="name"
      filter
      :options="domainsOptions.options"
      v-model="valueDomains"
      :loading="domainsOptions.done"
      @change="filterTuning"
      class="w-full sm:max-w-xs"
    />
    <Dropdown
      filter
      autoFilterFocus
      appendTo="self"
      optionValue="value"
      optionLabel="name"
      placeholder="Select network list"
      showClear
      :options="netWorkListOptions.options"
      v-model="valueNetwork"
      :loading="netWorkListOptions.done"
      @change="filterTuning"
      class="w-full sm:max-w-xs"
    />
  </div>
  <div
    class="border-1 border-bottom-none border-round-top-xl p-3.5 surface-border rounded-md mt-5 rounded-b-none"
  >
    <advancedFilter
      v-model:externalFilter="selectedFilter"
      v-model:filterAdvanced="selectedFilterAdvanced"
      :fieldsInFilter="listFields"
      @applyFilter="filterSearch"
    />
  </div>
  <ListTableBlock
    v-show="showListTable"
    pageTitleDelete="WAF rules tuning"
    :listService="props.listWafRulesTuningService"
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
    inTabs
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
    v-model:visible="showDetailsOfAttack"
    :listService="handleListWafRulesTuningAttacksService"
    :tuningObject="tuningSelected"
    :domains="domainNames"
    :netWorkList="netWorkListName"
    :time="timeName"
    @attack-on="createAllowedByAttack"
  >
  </MoreDetailsDrawer>

  <DialogAllowRule
    v-model:visible="showDialogAllowRule"
    :isLoading="isLoadingAllowed"
    @closeDialog="closeDialog"
    @reason="handleSubmitAllowRules"
  >
  </DialogAllowRule>
</template>
<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import DialogAllowRule from './Dialog'
  import MoreDetailsDrawer from './Drawer'

  import ListTableBlock from '@templates/list-table-block/with-selection-behavior'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'

  import advancedFilter from '@/templates/advanced-filter'
  import MultiSelect from 'primevue/multiselect'
  import { useToast } from 'primevue/usetoast'
  import { computed, onMounted, ref, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

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
  const isLoadingAllowed = ref(null)
  const showDialogAllowRule = ref(false)
  const showDetailsOfAttack = ref(false)
  const wafRuleId = ref(route.params.id)
  const netWorkListOptions = ref({ options: [], done: true })
  const domainsOptions = ref({ options: [], done: true })
  const tuningSelected = ref(null)
  const domainNames = ref('')
  const allowedByAttacks = ref([])
  const selectedFilterAdvanced = ref([])
  const listServiceWafTunningRef = ref('')
  const allowRuleOrigin = ref('')
  const valueDomains = computed({
    get: () => {
      if (domainsOptions.value.done) return []
      return selectedFilter.value.domains
    },
    set: (value) => {
      selectedFilter.value.domains = value
    }
  })

  const valueNetwork = computed({
    get: () => {
      if (netWorkListOptions.value.done || !selectedFilter.value.network?.id) return null
      return netWorkListOptions.value.options.find(
        (item) => item.value.id === selectedFilter.value.network?.id
      ).value
    },
    set: (value) => {
      selectedFilter.value.network = value
    }
  })

  const timeName = computed(
    () => timeOptions.value.find((item) => item.value === selectedFilter.value.hourRange).name
  )

  const netWorkListName = computed(() => {
    if (selectedFilter.value.network?.id) {
      return netWorkListOptions.value.options.find(
        (network) => network.value.id === selectedFilter.value.network?.id
      ).name
    }
    return ''
  })

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

  const showToast = (summary, severity) => {
    return toast.add({
      severity,
      summary,
      closable: true
    })
  }

  const getDomainNames = () => {
    domainNames.value = domainsOptions.value.options
      .filter((domain) => selectedFilter.value.domains.includes(domain.id))
      .map((domain) => domain.name)
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
    getDomainNames()
    tuningSelected.value = tuning
    showDetailsOfAttack.value = true
  }

  const goToDomain = () => {
    router.push({ name: 'list-domains' })
  }

  const handleSubmitAllowRules = async (reasonAttack) => {
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
        description: reasonAttack
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

    const { disabledIP, disabledCountries } = selectedFilter.value.network || {}

    listFields.value.find((item) => item.value === 'ip_address').disabled = disabledIP
    listFields.value.find((item) => item.value === 'country').disabled = disabledCountries

    const queryFields = {
      wafId: wafRuleId.value,
      domains: selectedFilter.value.domains,
      hourRange: selectedFilter.value.hourRange,
      network: selectedFilter.value.network?.id,
      filter
    }

    listServiceWafTunningRef.value.reload(queryFields)
  }

  const handleListWafRulesTuningAttacksService = async (path = '') => {
    const domainsId = encodeURIComponent(selectedFilter.value.domains)
    const matchesOn = `matches_on=${tuningSelected.value.matchesOn}`
    const matchesZone = `match_zone=${tuningSelected.value.matchZone}`
    const pathsList = path ? `&paths_list=${path}` : ''

    const query = `?hour_range=${selectedFilter.value.hourRange}&domains_ids=${domainsId}&${matchesOn}&${matchesZone}${pathsList}`

    return await props.listWafRulesTuningAttacksService({
      wafId: wafRuleId.value,
      tuningId: tuningSelected.value.id,
      query
    })
  }

  const setNetWorkListOptions = async () => {
    try {
      const response = await props.listNetworkListService()
      netWorkListOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      netWorkListOptions.value.done = false
    }
  }

  const setDomainsOptions = async () => {
    try {
      const response = await props.listWafRulesDomainsService({ wafId: wafRuleId.value })
      domainsOptions.value.options = response
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
