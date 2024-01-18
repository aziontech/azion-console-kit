<template>
  <div class="flex gap-6 mt-4">
    <Dropdown
      optionValue="value"
      optionLabel="name"
      :options="timeOptions"
      v-model="time"
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
      class="w-full sm:w-1/5"
    />
  </div>
  <ListTableNoHeaderBlock
    v-if="true"
    pageTitleDelete="Waf Rules Tuning"
    :columns="wafRulesAllowedColumns"
    :listService="handleListWafRulesTuningService"
    @on-load-data="handleLoadData"
    emptyListMessage="No Waf Rules Tuning found."
  >
    <template #addButton>
      <PrimeButton
        label="search"
        @click="filterTuning"
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
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
  <ActionBarTemplate
    v-if="showActionBar"
    @onSubmit="onSubmit"
    @onCancel="onCancel"
    :loading="loading"
    :submitDisabled="!formValid"
    primaryActionLabel="Allow Rules"
  />
</template>
<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import ListTableNoHeaderBlock from '@templates/list-table-block/no-header'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'

  import MultiSelect from 'primevue/multiselect'

  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'

  const route = useRoute()
  const hasContentToList = ref(false)
  const selectedDomain = ref([])
  // const country = ref([])
  const time = ref('60')
  const timeOptions = ref([
    {
      name: 'Last 1 hour',
      value: '60'
    },
    {
      name: 'Last 3 hours',
      value: '180'
    },
    {
      name: 'Last 6 hours',
      value: '360'
    },
    {
      name: 'Last 12 hours',
      value: '720'
    },
    {
      name: 'Last day',
      value: '1'
    },
    {
      name: 'Last 2 days',
      value: '2'
    },
    {
      name: 'Last 3 days',
      value: '3'
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
      field: 'ruleId',
      header: 'Rule ID'
    },
    {
      field: 'reason',
      header: 'Description'
    },
    {
      field: 'path',
      header: 'URI'
    }
  ])

  const handleListWafRulesTuningService = async () => {
    return await props.listWafRulesTuningService({ wafId: wafRuleId.value })
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
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
