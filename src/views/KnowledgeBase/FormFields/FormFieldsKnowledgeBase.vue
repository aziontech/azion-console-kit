<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'

  import { useField } from 'vee-validate'
  import { onMounted, nextTick } from 'vue'
  defineOptions({ name: 'form-fields-knowledge-base' })

  const props = defineProps({
    isEditMode: {
      type: Boolean,
      default: false
    }
  })

  const { setValue: setName } = useField('name')
  const { setValue: setDescription } = useField('description')
  const { value: embedding_model, setValue: setEmbeddingModel } = useField('embedding_model')

  // Set default embedding model on mount if not in edit mode
  onMounted(() => {
    if (!props.isEditMode && !embedding_model.value) {
      setEmbeddingModel('text-embedding-3-small')
    }
  })

  // Listen for form data changes from parent and manually set field values
  const handleExternalDataUpdate = (data) => {
    if (data && props.isEditMode) {
      nextTick(() => {
        if (data.name) {
          setName(data.name)
        }
        if (data.description) {
          setDescription(data.description)
        }
        if (data.embedding_model) {
          setEmbeddingModel(data.embedding_model)
        }
      })
    }
  }

  // For development - expose function to window for manual testing
  if (typeof window !== 'undefined') {
    window.testFormUpdate = (data) => {
      handleExternalDataUpdate(data)
    }
  }

  // Expose function to parent component
  defineExpose({
    handleExternalDataUpdate
  })

  const embeddingModelOptions = [
    { label: 'text-embedding-3-small (Default)', value: 'text-embedding-3-small' }
  ]

  // Note: Default values should be handled by the form initialization in create mode
  // or by the loaded data in edit mode - not manually set here
</script>

<template>
  <FormHorizontal
    title="Knowledge Base"
    description="Create knowledge base entries to store and organize information for AI assistance."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="Knowledge Base Name"
          :disabled="props.isEditMode"
          :description="
            props.isEditMode
              ? 'Name cannot be changed after creation.'
              : 'Give a descriptive name for the knowledge base.'
          "
          data-testid="knowledge-base-form__name-field"
        />
      </div>

      <div class="flex flex-col w-full gap-2">
        <FieldTextArea
          label="Description"
          required
          name="description"
          placeholder="Brief description of the knowledge base"
          description="Provide a brief description of what this knowledge base covers."
          rows="3"
          data-testid="knowledge-base-form__description-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Embedding Model"
          name="embedding_model"
          :options="embeddingModelOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select embedding model"
          disabled
          :description="
            props.isEditMode
              ? 'Embedding model cannot be changed after creation.'
              : 'The default embedding model is pre-selected for this knowledge base.'
          "
          data-testid="knowledge-base-form__embedding-model-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
