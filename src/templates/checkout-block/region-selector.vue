<template>
  <div class="flex w-full min-w-0 flex-1 flex-col gap-2">
    <FieldDropdown
      :name="name"
      label="State/Region"
      required
      :value="value"
      :options="options"
      :loading="loading"
      :disabled="disabled"
      optionLabel="name"
      optionValue="geonameId"
      placeholder="Select a State/Region"
      appendTo="self"
      filter
      class="w-full"
      @change="$emit('change', $event)"
    />
  </div>
</template>

<script setup>
  import FieldDropdown from '@aziontech/webkit/field-dropdown'

  defineOptions({ name: 'region-selector' })

  defineProps({
    name: { type: String, default: 'region' },
    value: { type: [String, Number], default: '' },
    options: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  })

  defineEmits(['change'])
</script>
