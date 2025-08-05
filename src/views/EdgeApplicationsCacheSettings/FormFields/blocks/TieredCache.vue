<template>
  <FormHorizontal
    title="Tiered Cache"
    description="Optimize cache hierarchy by defining how content is cached across multiple layers of the edge network, with a fixed maximum caching time of 1 year."
    isDrawer
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdown
          label="Tiered Cache Region"
          name="tieredCacheRegion"
          :options="TIERED_CACHE_REGION"
          optionLabel="label"
          optionValue="value"
          :value="tieredCacheRegion"
          inputId="tieredCacheRegion"
          placeholder="Select an Tiered Cache Region"
          description="Choose an Tiered Cache Region suitable for your application."
          data-testid="edge-application-cache-settings-form__tiered-caching-region-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'

  const TIERED_CACHE_REGION = [
    {
      label: 'near-edge',
      value: 'near-edge'
    },
    {
      label: 'br-east-1',
      value: 'br-east-1'
    },
    {
      label: 'us-east-1',
      value: 'us-east-1'
    }
  ]

  const { value: tieredCacheRegion } = useField('tieredCacheRegion')
</script>
