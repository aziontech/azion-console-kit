<template>
  <FormHorizontal
    title="Connector Type"
    description="Select the type of origin to connect to your edge connector."
    data-testid="edge-connectors-form__section__connector-type"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3">
        <FieldGroupRadio
          nameField="type"
          isCard
          :options="connectorTypeList"
          :value="type"
          data-testid="edge-connectors-form__connector-type__type-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'

  defineOptions({ name: 'EdgeConnectorsFormFieldsConnectorType' })

  const { value: type } = useField('type')

  const connectorTypeList = [
    {
      title: 'HTTP',
      inputValue: 'http',
      subtitle: 'Connect to external origins via secure HTTP protocol for seamless data delivery.'
    },
    {
      title: 'Edge Storage',
      inputValue: 'edge_storage',
      subtitle: 'Link your Edge Storage bucket for fast, low-latency data retrieval at the edge.'
    },
    {
      title: 'Live Ingest',
      inputValue: 'live_ingest',
      subtitle:
        'Enable real-time ingestion of live streams directly into your workloads for immediate processing and delivery.'
    }
  ]
</script>
