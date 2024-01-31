<template>
  <div class="flex gap-6 mt-4 flex-col sm:flex-row">
    <Dropdown
      optionValue="value"
      optionLabel="name"
      :options="timeOptions"
      v-model="time"
      @change="filterTuning"
      class="w-full sm:max-w-xs"
    />
    <MultiSelect
      placeholder="Select Domain"
      resetFilterOnHide
      autoFilterFocus
      optionValue="id"
      optionLabel="name"
      filter
      :options="domainsOptions.options"
      v-model="selectedDomain"
      :loading="domainsOptions.done"
      @change="filterTuning"
      class="w-full sm:max-w-xs"
    />
    <Dropdown
      optionValue="value"
      optionLabel="name"
      placeholder="Select Network List"
      filter
      showClear
      :options="netWorkListOptions.options"
      v-model="selectedNetworkList"
      :loading="netWorkListOptions.done"
      @change="filterTuning"
      class="w-full sm:max-w-xs"
    />
  </div>
  <ListTableNoHeaderBlock
    v-if="showListTable"
    pageTitleDelete="Waf Rules Tuning"
    :columns="wafRulesAllowedColumns"
    :hasListService="true"
    :dataFilted="dataFiltedComputed"
    @on-select-data="selectedItems"
    :cleanSelectData="cleanSelectData"
    :showselectionMode="true"
    :editInDrawer="openMoreDetails"
    emptyListMessage="No Waf Rules Tuning found."
  >
    <template #header>
      <advancedFilter
        :fieldsInFilter="listFields"
        hashDisabled
        @applyFilter="filterSearch"
      />
    </template>
  </ListTableNoHeaderBlock>

  <EmptyResultsBlock
    v-else
    title="Select a domain and filter possible attacks"
    description="Select at least one domain to get insights into your WAF Rule Set."
    :documentationService="props.documentationServiceTuning"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
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
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import DialogAllowRule from './Dialog'
  import MoreDetailsDrawer from './Drawer'

  import ListTableNoHeaderBlock from '@templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'

  import MultiSelect from 'primevue/multiselect'
  import advancedFilter from '@/templates/advanced-filter'
  import { ref, onMounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'

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

  const selectedDomain = ref([])
  const selectedNetworkList = ref()
  const dataFilted = ref([])
  const selectedEvents = ref([])
  const isLoadingAllowed = ref(null)
  const showDialogAllowRule = ref(false)
  const cleanSelectData = ref(null)
  const showDetailsOfAttack = ref(false)
  const wafRuleId = ref(route.params.id)
  const netWorkListOptions = ref({ options: [], done: true })
  const domainsOptions = ref({ options: [], done: true })
  const tuningSelected = ref(null)
  const domainNames = ref('')
  const allowedByAttacks = ref([])

  const dataFiltedComputed = computed(() => dataFilted.value)
  const timeName = computed(() => timeOptions.value.find((item) => item.value === time.value).name)
  const time = ref('1')

  const listFields = ref([
    {
      label: 'Country',
      value: 'country',
      description:
        'Name Field3: Description orem ipsum dolor sit amet, consectetur adipiscing elit. Duis quis velit venenatis, efficitur urna id, egestas mi.',
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
      description:
        'Name Field1: Description orem ipsum dolor sit amet, consectetur adipiscing elit. Duis quis velit venenatis, efficitur urna id, egestas mi.',
      operator: [
        { value: 'Eq', type: 'String', props: { placeholder: 'Select IP Address' } },
        { value: 'In', type: 'ArrayString', props: { placeholder: 'Enter with IP Address' } }
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
      header: 'Top 10 IPs Adress'
    },
    {
      field: 'topCountries',
      header: 'Top 10 Countries'
    }
  ])

  const showListTable = computed(() => {
    return selectedDomain.value.length
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
      .filter((domain) => selectedDomain.value.includes(domain.id))
      .map((domain) => domain.name)
  }

  const selectedItems = (events) => {
    selectedEvents.value = events
    cleanSelectData.value = null
  }

  const openDialog = () => {
    showDialogAllowRule.value = true
  }

  const cancelAllowed = () => {
    cleanSelectData.value = true
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

  const handleSubmitAllowRules = async (reason) => {
    const requestsAllowedRules = []
    let events = []
    if (allowedByAttacks.value.length) {
      events = [...allowedByAttacks.value]
    } else if (selectedEvents.value.length) {
      events = [...selectedEvents.value]
    }

    for (const event of events) {
      const matchZones = {
        zone: event.matchZone,
        matches_on: event.matchesOn
      }
      if (event.matchValue) {
        matchZones.zone_input = event.matchValue
        matchZones.zone = `conditional_${matchZones.zone}`
      }

      const payload = {
        ruleId: event.id,
        matchZone: [matchZones],
        reason
      }

      requestsAllowedRules.push(
        props.createWafRulesAllowedTuningService({
          payload,
          wafId: wafRuleId.value
        })
      )
    }

    try {
      const [{ value }] = await Promise.allSettled(requestsAllowedRules)
      showToast(value, 'success')
      filterSearch()
      closeDialog()
      selectedEvents.value = []
      allowedByAttacks.value = []
      cleanSelectData.value = true
      showDetailsOfAttack.value = false
    } catch (error) {
      showToast(error, 'error')
    } finally {
      isLoadingAllowed.value = false
    }
  }

  const createAllowedByAttack = (value) => {
    openDialog()
    allowedByAttacks.value = value
  }

  const filterTuning = async () => {
    filterSearch([])
  }

  const filterSearch = async (filter) => {
    if (!selectedDomain.value.length) return
    const { disabledIP, disabledCountries } = selectedNetworkList.value || {}

    listFields.value.find((item) => item.value === 'ip_address').disabled = disabledIP
    listFields.value.find((item) => item.value === 'country').disabled = disabledCountries

    const queryFields = {
      wafId: wafRuleId.value,
      domains: encodeURIComponent(selectedDomain.value),
      hourRange: time.value,
      network: selectedNetworkList.value?.id,
      filter
    }

    const response = await props.listWafRulesTuningService({ ...queryFields })
    dataFilted.value = response
  }

  const handleListWafRulesTuningAttacksService = async () => {
    const domainsId = encodeURIComponent(selectedDomain.value)
    const matchesOn = `matches_on=${tuningSelected.value.matchesOn}`
    const matchesZone = `match_zone=${tuningSelected.value.matchZone}`
    const query = `?hour_range=${time.value}&domains_ids=${domainsId}&${matchesOn}&${matchesZone}`

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
