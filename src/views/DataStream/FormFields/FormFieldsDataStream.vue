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
  <InputSection :disabled="hasNoPermissionToEditDataStream" />
  <TransformSection :disabled="hasNoPermissionToEditDataStream" />
  <RenderTemplateSection :disabled="hasNoPermissionToEditDataStream" />
  <OutputSection :disabled="hasNoPermissionToEditDataStream" />
  <StatusSection :disabled="hasNoPermissionToEditDataStream" />
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { useField } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'
  import InlineMessage from 'primevue/inlinemessage'

  import GeneralSection from './blocks/GeneralSection.vue'
  import InputSection from './blocks/InputSection.vue'
  import TransformSection from './blocks/TransformSection.vue'
  import OutputSection from './blocks/OutputSection.vue'
  import RenderTemplateSection from './blocks/RenderTemplateSection.vue'
  import StatusSection from './blocks/StatusSection.vue'

  import { dataStreamService } from '@/services/v2'

  const props = defineProps({
    resetForm: {
      type: Function,
      required: false
    }
  })

  const store = useAccountStore()

  // Form fields initialization
  const { value: name } = useField('name')

  const hasNoPermissionToEditDataStream = computed(() => !store.hasPermissionToEditDataStream)

  /**
   * Loads initial data for domains and templates
   * @returns {Promise<Array>} Array with domains and template data
   */
  const loadInitialData = async () => {
    const [domainsData, templateData] = await Promise.all([
      loadDomains(),
      loadTemplates()
    ])
    return [domainsData, templateData]
  }

  /**
   * Loads available domains for the data stream
   * @returns {Promise<Array>} Domains array structure
   */
  const loadDomains = async () => {
    if (!props.resetForm) return [[], []]

    const response = await dataStreamService.listWorkloadsService({
      page: 1,
      pageSize: 100,
      fields: 'id, name'
    })
    return [response.results, []]
  }

  /**
   * Loads available templates and returns the first template ID
   * @returns {Promise<string>} First template ID
   */
  const loadTemplates = async () => {
    const templates = await dataStreamService.listTemplates({
      fields: 'id,name,data_set'
    })
    return templates.results[0]?.id ?? ''
  }

  /**
   * Initializes form with default values
   */
  const initializeForm = async () => {
    if (!props.resetForm) return

    const [domainsData, templateId] = await loadInitialData()

    const initialValues = {
      name: name.value,
      dataSource: 'http',
      template: templateId,
      dataSet: '',
      domainOption: '1',
      domains: domainsData,
      endpoint: 'standard',
      status: true,
      hasSampling: false,
      samplingPercentage: 0
    }

    props.resetForm({ values: initialValues })
  }

  onMounted(() => {
    initializeForm()
  })
</script>
