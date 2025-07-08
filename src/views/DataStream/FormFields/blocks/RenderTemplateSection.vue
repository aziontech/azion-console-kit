<template>
  <FormHorizontal
    title="Input"
    description="Define the source and the variables from which data should be collected."
    data-testid="data-stream-form__section__data-settings"
  >
    <template #inputs>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            label="Data Source"
            required
            name="dataSource"
            :options="listDataSources"
            optionLabel="label"
            optionValue="value"
            :value="dataSource"
            appendTo="self"
            description="Represents the data source the data will be collected from."
            data-testid="data-stream-form__data-settings__data-source-field"
            :disabled="disabled"
          />
        </div>
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            label="Template"
            required
            name="template"
            :options="listTemplates"
            optionLabel="name"
            optionValue="id"
            :value="template"
            appendTo="self"
            description="Represents a preset of variables for specific sources or an open template to choose variables."
            data-testid="data-stream-form__data-settings__template-field"
            :disabled="disabled"
          />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <label
          for="dataset"
          class="text-color text-base font-medium"
          >Data Set</label
        >
        <vue-monaco-editor
          v-model:value="dataSet"
          language="json"
          :theme="theme"
          :options="dataSetMonacoOptions"
          class="min-h-[300px] surface-border border rounded-sm overflow-hidden"
          data-testid="data-stream-form__data-settings__data-set-field"
          :readOnly="disabled"
        />
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="data-stream-form__data-settings__data-set-description"
        >
          Exhibits or allows writing the variables that'll be sent to the connector in a JSON
          format.
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import { useField } from 'vee-validate'
  import { computed, ref, watch, onMounted } from 'vue'
  import { dataStreamService } from '@/services/v2'
  import { useAccountStore } from '@/stores/account'

  defineProps({
    disabled: {
      type: Boolean,
      required: true
    }
  })

  const store = useAccountStore()
  const listDataSources = ref([
    { label: 'Activity History', value: 'rtm_activity' },
    { label: 'Edge Applications', value: 'http' },
    { label: 'Edge Functions', value: 'cells_console' },
    { label: 'WAF Events', value: 'waf' }
  ])

  const listTemplates = ref([])

  const { value: dataSource } = useField('dataSource')
  const { value: dataSet } = useField('dataSet')
  const { value: template } = useField('template')

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const DEFAULT_MONACO_OPTIONS = {
    minimap: { enabled: false },
    wordWrap: 'on',
    tabSize: 2,
    formatOnPaste: true
  }
  const dataSetMonacoOptions = ref({ ...DEFAULT_MONACO_OPTIONS })

  const loaderDataStreamTemplates = async () => {
    const templates = await dataStreamService.listTemplates({
      fields: 'id,name,data_set'
    })
    listTemplates.value = templates.results

    return listTemplates.value[0].id ?? ''
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

  watch(
    () => template.value,
    (newValue, oldValue) => {
      const templateID = newValue
      const isFirstRender = !oldValue
      if (templateID && listTemplates.value.length) insertDataSet(templateID, isFirstRender)

      const isReadOnlyIfCustomTemplate = templateID !== 'CUSTOM_TEMPLATE'
      dataSetMonacoOptions.value.readOnly = isReadOnlyIfCustomTemplate
    }
  )

  watch(
    () => listTemplates.value,
    (newValue) => {
      if (newValue.length) insertDataSet(template.value, false)
    }
  )

  onMounted(async () => {
    await loaderDataStreamTemplates()
  })
</script>
