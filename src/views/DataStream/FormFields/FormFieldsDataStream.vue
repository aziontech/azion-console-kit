<template>
  <InlineMessage
    v-if="hasNoPermissionToEditDataStream"
    class="w-fit"
    severity="info"
    data-testid="permission-rule-message-data-stream"
  >
    This account has <strong>View Data Stream</strong> permission only. It allows viewing the
    account’s streams but doesn't permit creating, editing, or deleting streams.
  </InlineMessage>

  <GeneralSection :disabled="hasNoPermissionToEditDataStream" />
  <DataSettingsSection :disabled="hasNoPermissionToEditDataStream" />
  <DomainsSection :disabled="hasNoPermissionToEditDataStream" />
  <SamplingSection :disabled="hasNoPermissionToEditDataStream" />
  <DestinationSection :disabled="hasNoPermissionToEditDataStream" />

  <PayloadSection
    :disabled="hasNoPermissionToEditDataStream"
    :endpoint="endpoint"
  />
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useField } from 'vee-validate'
  import { useRoute } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import InlineMessage from 'primevue/inlinemessage'

  import GeneralSection from './blocks/GeneralSection.vue'
  import DataSettingsSection from './blocks/InputSection.vue'
  import DomainsSection from './blocks/DomainsSection.vue'
  import SamplingSection from './blocks/SamplingSection.vue'
  import DestinationSection from './blocks/DestinationSection.vue'
  import PayloadSection from './blocks/PayloadSection.vue'

  import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'
  import { dataStreamService } from '@/services/v2'

  const props = defineProps({
    resetForm: {
      type: Function,
      required: false
    }
  })

  const store = useAccountStore()

  // Form Fields
  useField('status')
  const { value: name } = useField('name')
  const { value: dataSet } = useField('dataSet')
  const { value: template } = useField('template')
  const { value: domainOption } = useField('domainOption')
  const { value: domains } = useField('domains')
  const { value: endpoint } = useField('endpoint')

  // Data Templates
  const listTemplates = ref([])

  const loaderDataStreamTemplates = async () => {
    const templates = await dataStreamService.listTemplates({
      fields: 'id,name,data_set'
    })
    listTemplates.value = templates.results

    return listTemplates.value[0].id ?? ''
  }

  const loaderDataStreamDomains = async () => {
    if (!props.resetForm) return
    const domainResponse = await dataStreamService.listWorkloadsService({
      page: 1,
      pageSize: 100,
      fields: 'id, name'
    })
    return [domainResponse.results, []]
  }

  const insertDataSet = async (templateID, isFirstRender) => {
    const index = listTemplates.value.map((el) => el.id).indexOf(templateID)
    try {
      if (templateID === 'CUSTOM_TEMPLATE' && !isFirstRender) {
        dataSet.value = ''
      } else {
        const dataSetJSON = JSON.parse(listTemplates.value[index].dataSet)
        dataSet.value = JSON.stringify(dataSetJSON, null, '\t')
      }
    } catch (exception) {
      if ((!dataSet.value || templateID !== 'CUSTOM_TEMPLATE') && index > 0) {
        dataSet.value = listTemplates.value[index].dataSet
      }
    }
  }

  const isAllDomainsSelected = computed(() => {
    return domainOption.value === '1'
  })

  const hasNoPermissionToEditDataStream = computed(() => !store.hasPermissionToEditDataStream)

  const placeholderLineSeparator = computed(() => {
    const text = '"\\n"'
    return `Character that'll be used at the end of each log line. The ${text} escape sequence breaks values into different lines in NDJSON format.`
  })

  watch(
    () => template.value,
    (newValue, oldValue) => {
      const templateID = newValue
      const isFirstRender = !oldValue
      if (templateID && listTemplates.value.length) insertDataSet(templateID, isFirstRender)
    }
  )

  watch(
    () => listTemplates.value,
    (newValue) => {
      if (newValue.length) insertDataSet(template.value, false)
    }
  )

  watch(
    () => domainOption.value,
    (option) => {
      if (option === '1') {
        if (domains.value[1] && domains.value[1].length > 0) {
          domains.value[1].forEach((element) => {
            domains.value[0].push(element)
          })
          domains.value[1] = []
        }
      }
    }
  )

  const initializeFormValues = async () => {
    const [domains, template] = await Promise.all([
      loaderDataStreamDomains(),
      loaderDataStreamTemplates()
    ])

    if (props.resetForm) {
      const initialValues = {
        name: name.value,
        dataSource: 'http',
        template: template,
        dataSet: '',
        domainOption: '1',
        domains: domains,
        endpoint: 'standard',
        status: true,
        hasSampling: false,
        samplingPercentage: 0
      }

      props.resetForm({ values: initialValues })
    }
  }

  onMounted(() => {
    initializeFormValues()
  })
</script>
