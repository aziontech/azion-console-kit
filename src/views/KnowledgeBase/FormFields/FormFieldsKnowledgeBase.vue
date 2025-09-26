<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'

  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-knowledge-base' })

  const { value: name } = useField('name')
  const { value: description } = useField('description')
  const { value: embedding_model } = useField('embedding_model')

  const embeddingModelOptions = [
    { label: 'Qwen3 Embedding 4B (Default)', value: 'Qwen/Qwen3-Embedding-4B' }
  ]

  // Set default embedding model
  if (!embedding_model.value) {
    embedding_model.value = 'Qwen/Qwen3-Embedding-4B'
  }
</script>

<template>
  <FormHorizontal
    title="Knowledge Base Item"
    description="Create knowledge base items to store and organize information for AI assistance."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="Knowledge Base Item Name"
          :value="name"
          description="Give a descriptive name for the knowledge base item."
          data-testid="knowledge-base-form__name-field"
        />
      </div>

      <div class="flex flex-col w-full gap-2">
        <FieldTextArea
          label="Description"
          required
          name="description"
          placeholder="Brief description of the knowledge base item"
          :value="description"
          description="Provide a brief description of what this knowledge base item covers."
          rows="3"
          data-testid="knowledge-base-form__description-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Embedding Model"
          name="embedding_model"
          :value="embedding_model"
          :options="embeddingModelOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select embedding model"
          description="Choose the embedding model for this knowledge base item."
          data-testid="knowledge-base-form__embedding-model-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>