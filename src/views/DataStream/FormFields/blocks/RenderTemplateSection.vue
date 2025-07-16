<template>
  <FormHorizontal
    title="Render Template"
    description="Choose or create a template to define the structure of the data sent to the destination platform."
    data-testid="data-stream-form__section__data-settings"
  >
    <template #inputs>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdownLazyLoader
            ref="templateDropdownRef"
            label="Template"
            name="template"
            :value="template"
            :service="loaderDataStreamTemplates"
            :loadService="dataStreamService.loadTemplateService"
            @onSelectOption="handleSelectTemplate"
            :moreOptions="['custom', 'dataSet']"
            optionLabel="name"
            optionValue="id"
            optionGroupLabel="label"
            optionGroupChildren="items"
            description="Represents a preset of variables for specific sources or an open template to choose variables."
            data-testid="data-stream-form__data-settings__template-field"
            :disabled="disabled"
            placeholder="Select a Template"
          >
            <template #footer>
              <ul class="p-2">
                <li>
                  <PrimeButton
                    class="w-full whitespace-nowrap flex"
                    data-testid="data-stream-form__data-settings__template-field__create-custom-template-button"
                    text
                    @click="openCreateTemplateDrawer"
                    size="small"
                    icon="pi pi-plus-circle"
                    :pt="{
                      label: { class: 'w-full text-left' },
                      root: { class: 'p-2' }
                    }"
                    label="Create Custom Template"
                  />
                </li>
              </ul>
            </template>
          </FieldDropdownLazyLoader>
        </div>
      </div>
      <div class="flex flex-col gap-2 relative">
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
        />
        <PrimeButton
          v-if="isCustomTemplate"
          icon="pi pi-pencil"
          outlined
          class="absolute top-10 right-2 bg-[#171717]"
          label="Edit Template"
          size="small"
          @click="openEditTemplateDrawer"
        />
        <PrimeButton
          v-else
          icon="pi pi-copy"
          outlined
          class="absolute top-10 right-2 bg-[#171717]"
          label="Duplicate Template"
          size="small"
          @click="openDuplicateTemplateDrawer"
        />
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="data-stream-form__data-settings__data-set-description"
        >
          Exhibits variables that'll be sent to the connector in a JSON format.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <DrawerTemplate
    ref="drawerTemplateRef"
    @onSuccess="handleSuccessCreateNewTemplate"
    @onDelete="handleDeleteTemplate"
  />
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PrimeButton from 'primevue/button'
  import { useField } from 'vee-validate'
  import { computed, ref } from 'vue'
  import { dataStreamService } from '@/services/v2'
  import { useAccountStore } from '@/stores/account'
  import DrawerTemplate from '@/views/DataStream/Drawer'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'

  defineProps({
    disabled: {
      type: Boolean,
      required: true
    }
  })

  const store = useAccountStore()

  const { value: dataSet } = useField('dataSet')
  const { value: template } = useField('template')

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const drawerTemplateRef = ref(null)
  const templateDropdownRef = ref(null)
  const isCustomTemplate = ref(false)

  const DEFAULT_MONACO_OPTIONS = {
    minimap: { enabled: false },
    wordWrap: 'on',
    tabSize: 2,
    formatOnPaste: true,
    readOnly: true
  }
  const dataSetMonacoOptions = ref({ ...DEFAULT_MONACO_OPTIONS })

  const loaderDataStreamTemplates = async (params = { page: 1, pageSize: 100 }) => {
    const templates = await dataStreamService.listTemplates({
      fields: 'id,name,data_set,custom',
      ...params,
      ordering: '!custom'
    })

    const itemsCustom = templates.results.filter((template) => template.custom)
    const itemsAzion = templates.results.filter((template) => !template.custom)

    return {
      body: [
        {
          label: `Azion's Templates`,
          items: itemsAzion
        },
        {
          label: 'Custom Templates',
          items: itemsCustom
        }
      ],
      count: templates.count
    }
  }

  const processTemplateDataSet = (selectedTemplate) => {
    if (!selectedTemplate) {
      dataSet.value = ''
      return
    }

    try {
      if (selectedTemplate.dataSet) {
        const dataSetJSON = JSON.parse(selectedTemplate.dataSet)
        dataSet.value = JSON.stringify(dataSetJSON, null, '\t')
      } else {
        dataSet.value = ''
      }
    } catch (exception) {
      dataSet.value = selectedTemplate.dataSet || ''
    }
  }

  const setIsCustomTemplate = (selectedTemplate) => {
    isCustomTemplate.value = selectedTemplate.custom
  }

  const insertDataSet = async (selectedTemplate = null) => {
    const template = selectedTemplate

    if (!template) {
      dataSet.value = ''
      return
    }

    processTemplateDataSet(template)
  }

  const handleSuccessCreateNewTemplate = async (response) => {
    drawerTemplateRef.value.closeDrawer?.()
    if (templateDropdownRef.value?.refreshData) {
      await templateDropdownRef.value.refreshData()
    }

    template.value = response.id
  }

  const handleDeleteTemplate = () => {
    loaderDataStreamTemplates({ page: 1, pageSize: 100 })
  }

  const handleSelectTemplate = (template) => {
    insertDataSet(template)
    setIsCustomTemplate(template)
  }

  const openCreateTemplateDrawer = () => {
    if (drawerTemplateRef.value?.openCreateDrawer) {
      drawerTemplateRef.value.openCreateDrawer()
    }
  }

  const openEditTemplateDrawer = () => {
    if (drawerTemplateRef.value?.openEditDrawer) {
      drawerTemplateRef.value.openEditDrawer(template.value)
    }
  }

  const openDuplicateTemplateDrawer = () => {
    if (drawerTemplateRef.value?.openCreateDrawer) {
      drawerTemplateRef.value.openCreateDrawer(dataSet.value)
    }
  }
</script>
