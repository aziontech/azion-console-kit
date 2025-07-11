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
            label="Template"
            required
            name="template"
            :options="listTemplates"
            optionGroupLabel="label"
            optionGroupChildren="items"
            optionLabel="name"
            optionValue="id"
            :value="template"
            appendTo="self"
            description="Represents a preset of variables for specific sources or an open template to choose variables."
            data-testid="data-stream-form__data-settings__template-field"
            :disabled="disabled"
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
          </FieldDropdown>
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
          :readOnly="true"
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
    @onSuccess="handleSuccess"
    @onDelete="handleDeleteTemplate"
  />
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import PrimeButton from 'primevue/button'
  import { useField } from 'vee-validate'
  import { computed, ref, watch, onMounted } from 'vue'
  import { dataStreamService } from '@/services/v2'
  import { useAccountStore } from '@/stores/account'
  import DrawerTemplate from '@/views/DataStream/Drawer'

  defineProps({
    disabled: {
      type: Boolean,
      required: true
    }
  })

  const store = useAccountStore()

  const listTemplates = ref([])

  const { value: dataSet } = useField('dataSet')
  const { value: template } = useField('template')

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const drawerTemplateRef = ref(null)
  const isCustomTemplate = ref(false)

  const DEFAULT_MONACO_OPTIONS = {
    minimap: { enabled: false },
    wordWrap: 'on',
    tabSize: 2,
    formatOnPaste: true
  }
  const dataSetMonacoOptions = ref({ ...DEFAULT_MONACO_OPTIONS })

  const loaderDataStreamTemplates = async () => {
    const templates = await dataStreamService.listTemplates({
      fields: 'id,name,data_set,custom',
      pageSize: 1000
    })

    const itemsCustom = templates.results.filter((template) => template.custom)
    const itemsAzion = templates.results.filter((template) => !template.custom)

    listTemplates.value = [
      {
        label: `Azion's Templates`,
        items: itemsAzion
      },
      {
        label: 'Custom Templates',
        items: itemsCustom
      }
    ]

    const hasFirstItem = listTemplates.value[0]?.items[0]?.id

    if (hasFirstItem) {
      const firstTemplate = listTemplates.value[0].items[0]
      template.value = firstTemplate.id

      await insertDataSet(firstTemplate.id, firstTemplate)
      setIsCustomTemplate(firstTemplate)
    }

    return !!hasFirstItem ?? ''
  }

  const findTemplateById = (templateId) => {
    if (!templateId || !listTemplates.value?.length) return null

    for (const group of listTemplates.value) {
      const template = group.items?.find((item) => item.id === templateId)
      if (template) return template
    }
    return null
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

  const insertDataSet = async (templateId, selectedTemplate = null) => {
    const template = selectedTemplate || findTemplateById(templateId)

    if (!template) {
      dataSet.value = ''
      return
    }

    processTemplateDataSet(template)
  }

  watch(
    () => template.value,
    (newTemplateId) => {
      if (!newTemplateId || !listTemplates.value?.length) return

      const selectedTemplate = findTemplateById(newTemplateId)
      insertDataSet(newTemplateId, selectedTemplate)

      const isReadOnlyTemplate = selectedTemplate?.custom === false
      dataSetMonacoOptions.value.readOnly = isReadOnlyTemplate
      setIsCustomTemplate(selectedTemplate)
    }
  )

  watch(
    () => listTemplates.value,
    (newTemplatesList) => {
      if (!newTemplatesList?.length || !template.value) return

      const selectedTemplate = findTemplateById(template.value)
      if (selectedTemplate) {
        insertDataSet(template.value, selectedTemplate)
      }
    }
  )

  const handleSuccess = () => {
    drawerTemplateRef.value.closeDrawer?.()
  }

  const handleDeleteTemplate = () => {
    loaderDataStreamTemplates()
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

  onMounted(async () => {
    await loaderDataStreamTemplates()
  })
</script>
