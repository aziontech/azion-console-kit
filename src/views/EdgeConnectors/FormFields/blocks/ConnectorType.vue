<template>
  <FormHorizontal
    title="Connector Type"
    description="Select the type of origin to connect to your Connector."
    data-testid="edge-connectors-form__section__connector-type"
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3">
        <FieldGroupRadio
          nameField="type"
          isCard
          :options="connectorTypeList"
          :value="type"
          data-testid="edge-connectors-form__connector-type__type-field"
          :disabled="isEditRoute"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import { useRoute } from 'vue-router'
  import { computed } from 'vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  defineOptions({ name: 'EdgeConnectorsFormFieldsConnectorType' })

  const { value: type } = useField('type')

  const connectorTypeList = [
    {
      title: 'HTTP',
      inputValue: 'http',
      subtitle: 'Connect to external origins via secure HTTP protocol for seamless data delivery.'
    },
    {
      title: 'Object Storage',
      inputValue: 'storage',
      subtitle: 'Link your Object Storage bucket for fast, low-latency data retrieval at the edge.'
    },
    {
      title: 'Live Ingest',
      inputValue: 'live_ingest',
      subtitle:
        'Enable real-time ingestion of live streams directly into your Workloads for immediate processing and delivery.'
    }
  ]

  const route = useRoute()

  const isEditRoute = computed(() => {
    return route.name?.toString().includes('edit') || route.path.includes('edit')
  })
</script>
