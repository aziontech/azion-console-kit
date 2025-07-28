<template>
  <FormHorizontal
    title="General"
    isDrawer
    description="Provide the details to create a custom template for your data stream."
    data-testid="data-stream-form__template__section__general"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          description="Give a unique and descriptive name to identify the custom template."
          name="name"
          :value="name"
          placeholder="My custom template"
          data-testid="data-stream-form__template__name-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Data Set"
    isDrawer
    description="Define the variables and structure for the data set in JSON format."
    data-testid="data-stream-form__template__section__data-set"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <vue-monaco-editor
          v-model:value="dataSet"
          language="json"
          :theme="theme"
          :options="dataSetMonacoOptions"
          class="min-h-[300px] surface-border border rounded-sm overflow-hidden"
          data-testid="data-stream-form__template__data-set-field"
        />
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="data-stream-form__template__data-set-description"
        >
          Exhibits variables that'll be sent to the connector in a JSON format.
        </small>
        <small
          v-if="dataSetErrorMessage"
          data-testid="data-stream-form__template__data-set-error"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ dataSetErrorMessage }}
        </small>
      </div>
    </template>
  </FormHorizontal>

  <div v-if="templateId">
    <DangerCard
      title="Danger area"
      buttonLabel="Delete template"
      @action="handleDeleteTemplate"
    />
  </div>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import DangerCard from '@/templates/danger-card-block/index.vue'
  import { computed, ref } from 'vue'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { useField } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'
  import { dataStreamService } from '@/services/v2'

  const { value: name } = useField('name')
  const { value: dataSet, errorMessage: dataSetErrorMessage } = useField('dataSet')

  const store = useAccountStore()
  const { openDeleteDialog: openDeleteDialogComposable } = useDeleteDialog()

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const props = defineProps({
    templateId: {
      type: String,
      required: true
    }
  })

  const DEFAULT_MONACO_OPTIONS = {
    minimap: { enabled: false },
    wordWrap: 'on',
    tabSize: 2,
    formatOnPaste: true
  }
  const dataSetMonacoOptions = ref({ ...DEFAULT_MONACO_OPTIONS })

  const decorateDeleteService = async () => {
    return await dataStreamService.deleteTemplateService(props.templateId)
  }

  const emit = defineEmits(['onDelete'])

  const handleDeleteTemplate = () => {
    openDeleteDialogComposable({
      title: 'Custom Template',
      id: props.templateId,
      data: {
        entityDeleteMessage:
          'This Custom Template will be deleted along with all associated data. Check the Help Center for more details.'
      },
      deleteService: decorateDeleteService,
      successCallback: () => emit('onDelete')
    })
  }
</script>
