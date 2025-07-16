<template>
  <FormHorizontal
    title="General"
    description="Create a stream to feed your data platforms with logs from your applications."
    data-testid="data-stream-form__section__general"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          description="Give a unique and descriptive name to identify the data stream."
          name="name"
          placeholder="My data stream"
          data-testid="data-stream-form__general__name-field"
          :disabled="disabled"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText.vue'

  defineProps({
    disabled: {
      type: Boolean,
      required: true
    }
  })
</script>
