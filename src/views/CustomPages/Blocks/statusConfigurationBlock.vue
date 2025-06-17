<template>
  <FormHorizontal
    title="Status Configuration"
    description="Configure the settings for the selected HTTP status code. Define how the custom page will behave, including its type, associated Edge Connector, and response details."
    :isDrawer="props.isDrawer"
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
    { label: 'Default', value: 'Default' },
    { label: 'Connector', value: 'Connector' }
  ]

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })
</script>
