<template>
  <div class="flex gap-6 mt-4">
    <Dropdown
      optionValue="value"
      optionLabel="name"
      :options="timeOptions"
      v-model="time"
      @change="filterTuning"
      class="w-full sm:w-1/5"
    />
    <MultiSelect
      placeholder="Sample Domain"
      optionValue="id"
      optionLabel="name"
      filter
      :options="domainsOptions.options"
      v-model="selectedDomain"
      :loading="!domainsOptions.done"
      @change="filterTuning"
      class="w-full sm:w-1/5"
    />
  </div>
  <ListTableNoHeaderBlock
    v-if="selectedDomain.length"
    pageTitleDelete="Waf Rules Tuning"
    :columns="wafRulesAllowedColumns"
    :hasListService="true"
    :dataFilted="dataFiltedComputed"
    @on-select-data="selectedItems"
    emptyListMessage="No Waf Rules Tuning found."
  >
    <template #addButton> </template>
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
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
  <ActionBarTemplate
    v-if="showActionBar"
    @onSubmit="openDialog"
    @onCancel="closeDialog"
    :submitDisabled="!selectedEvents.length"
    primaryActionLabel="Allow Rules"
  />

  <DialogAllowRule
    v-model:visible="showDialogAllowRule"
    @closeDialog="closeDialog"
    @reason="handleAllowRules"
  >
  </DialogAllowRule>
</template>
<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import DialogAllowRule from './Dialog'

  import ListTableNoHeaderBlock from '@templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'

  import MultiSelect from 'primevue/multiselect'

  import { ref, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'

  const route = useRoute()
  const selectedDomain = ref([])
  const dataFilted = ref([])
  const selectedEvents = ref([])
  const showDialogAllowRule = ref(false)

  const dataFiltedComputed = computed(() => dataFilted.value)
  const time = ref('1')
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
    }
  })

  const toast = useToast()

  const showToast = (summary, severity) => {
    return toast.add({
      severity,
      summary,
      closable: true
    })
  }

  const wafRuleId = ref(route.params.id)

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

  const selectedItems = (events) => {
    selectedEvents.value = events
  }

  const openDialog = () => {
    showDialogAllowRule.value = true
  }

  const closeDialog = () => {
    showDialogAllowRule.value = false
  }

  const handleAllowRules = async (reason) => {
    const allowedRules = []
    for (const allowed of selectedEvents.value) {
      allowedRules.push({
        match_zone: allowed.matchZone,
        matches_on: allowed.matchesOn,
        rule_id: allowed.ruleId
      })
    }

    const payload = {
      reason,
      allowedRules
    }

    try {
      await props.createWafRulesAllowedTuningService({ payload, wafId: wafRuleId.value })
    } catch (error) {
      showToast(error, 'error')
    }
  }

  const filterTuning = async () => {
    if (!selectedDomain.value.length) return
    const query = `?hour_range=${time.value}&domains_ids=${encodeURIComponent(
      selectedDomain.value
    )}`
    const response = await props.listWafRulesTuningService({ wafId: wafRuleId.value, query })
    dataFilted.value = response
  }

  const countriesOptions = ref({ options: [], done: true })
  const netWorkListOptions = ref({ options: [], done: true })
  const domainsOptions = ref({ options: [], done: true })

  const setCountriesOptions = async () => {
    countriesOptions.value.done = false
    try {
      const response = await props.listCountriesService()
      countriesOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      countriesOptions.value.done = true
    }
  }

  const setNetWorkListOptions = async () => {
    netWorkListOptions.value.done = false
    try {
      const response = await props.listNetworkListService()
      netWorkListOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      netWorkListOptions.value.done = true
    }
  }

  const setDomainsOptions = async () => {
    domainsOptions.value.done = false
    try {
      const response = await props.listWafRulesDomainsService({ wafId: wafRuleId.value })
      domainsOptions.value.options = response
    } catch (error) {
      showToast(error, 'error')
    } finally {
      domainsOptions.value.done = true
    }
  }

  onMounted(async () => {
    await setCountriesOptions()
    await setNetWorkListOptions()
    await setDomainsOptions()
  })
</script>
