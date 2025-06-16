<template>
  <FormHorizontal
    isDrawer
    title="Status Configuration"
    description="Configure the settings for the selected HTTP status code. Define how the custom page will behave, including its type, associated Edge Connector, and response details."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Type"
          required
          name="type"
          :options="listTypes"
          optionLabel="label"
          optionValue="value"
          :value="type"
          appendTo="self"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'

  const listTypes = [
    { label: 'Default', value: 'pageDefault' },
    { label: 'Custom', value: 'pageCustom' }
  ]
</script>
