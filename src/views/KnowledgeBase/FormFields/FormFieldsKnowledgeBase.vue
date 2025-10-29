<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import { useField } from 'vee-validate'

  defineOptions({ name: 'form-fields-knowledge-base' })

  const props = defineProps({
    isEditMode: {
      type: Boolean,
      default: false
    }
  })

  const { value: embeddingModel } = useField('embedding_model')

  const embeddingModelOptions = [
    { label: 'text-embedding-3-small (Default)', value: 'text-embedding-3-small' }
  ]
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
          :value="embeddingModel"
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
