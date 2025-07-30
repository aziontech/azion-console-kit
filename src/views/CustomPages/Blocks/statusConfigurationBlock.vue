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
          disabled
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          label="Page Code"
          required
          name="code.value"
          :options="optionsCode"
          optionLabel="label"
          optionValue="value"
          appendTo="self"
          :disabled="props.isEdit"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import { CODE_OPTIONS } from '@/views/CustomPages/Config/listStatusCode'
  import { computed } from 'vue'

  const listTypes = [
    { label: 'Page Default', value: 'page_default' },
    { label: 'Page Connector', value: 'page_connector' }
  ]

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    optionsStatusCode: {
      type: Array,
      default: () => []
    }
  })

  const optionsCode = computed(() => {
    if (props.isEdit) {
      return CODE_OPTIONS
    }
    const pagesCodes = new Set(props.optionsStatusCode.map((page) => page.code.value))
    return CODE_OPTIONS.filter((option) => !pagesCodes.has(option.value))
  })
</script>
