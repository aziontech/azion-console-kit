<template>
  <FormHorizontal
    title="Input"
    description="Define the source and the variables from which data should be collected."
    data-testid="data-stream-form__section__data-settings"
  >
    <template #inputs>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <FieldDropdown
            label="Data Source"
            required
            name="dataSource"
            :options="listDataSources"
            optionLabel="label"
            optionValue="value"
            :value="dataSource"
            appendTo="self"
            description="Represents the data source the data will be collected from."
            data-testid="data-stream-form__data-settings__data-source-field"
            :disabled="disabled"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import { useField } from 'vee-validate'
  import { ref } from 'vue'

  defineProps({
    disabled: {
      type: Boolean,
      required: true
    }
  })

  const listDataSources = ref([
    { label: 'Activity History', value: 'activity' },
    { label: 'Edge Applications', value: 'http' },
    { label: 'Edge Functions', value: 'functions' },
    { label: 'WAF Events', value: 'waf' }
  ])

  const { value: dataSource } = useField('dataSource')
</script>
