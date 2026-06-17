<template>
  <div class="flex w-full min-w-0 flex-1 flex-col gap-2">
    <FieldDropdown
      :name="name"
      label="Country"
      required
      :value="value"
      :options="options"
      :loading="loading"
      optionLabel="name"
      optionValue="geonameId"
      placeholder="Select a Country"
      appendTo="self"
      filter
      class="w-full"
      @change="$emit('change', $event)"
    />
  </div>
</template>

<script setup>
  import FieldDropdown from '@aziontech/webkit/field-dropdown'

  defineOptions({ name: 'country-selector' })

  defineProps({
    name: { type: String, default: 'country' },
    value: { type: [String, Number], default: '' },
    options: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  })

  defineEmits(['change'])
</script>
