<template>
  <FormHorizontal
    title="Load Balancer Configuration"
    description="Configure load balancing settings to define how the Edge Connector distributes traffic and manages connections with origins."
    data-testid="edge-connectors-form__section__load-balancer-configuration"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldDropdown
          label="Method"
          name="method"
          :options="methodsList"
          optionLabel="label"
          optionValue="value"
          :value="method"
          appendTo="self"
          description="Select the load balancing method to define how traffic is distributed across multiple origins."
          data-testid="edge-connectors-form__load-balancer-configuration__method-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldNumber
          label="Max Retries"
          name="maxRetries"
          :value="maxRetries"
          description="Maximum number of retry attempts for failed connections. Value 0 for no retries. Valid range: 0-20."
          data-testid="edge-connectors-form__load-balancer-configuration__max-retries-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldNumber
          label="Connection Timeout"
          name="connectionTimeout"
          :value="connectionTimeout"
          description="Maximum time (in seconds) the Edge Connector will wait to establish a connection with the origin. Valid range: 1-300."
          data-testid="edge-connectors-form__load-balancer-configuration__connection-timeout-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldNumber
          label="Read/Write Timeout"
          name="readWriteTimeout"
          :value="readWriteTimeout"
          description="Maximum time (in seconds) the Edge Connector will wait for data to be read from or written to the origin. Valid range: 1-600."
          data-testid="edge-connectors-form__load-balancer-configuration__read-write-timeout-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'

  defineOptions({ name: 'EdgeConnectorsFormFieldsLoadBalancerConfiguration' })

  const { value: method } = useField('method')
  const { value: maxRetries } = useField('maxRetries')
  const { value: connectionTimeout } = useField('connectionTimeout')
  const { value: readWriteTimeout } = useField('readWriteTimeout')

  const methodsList = [
    { label: 'Round Robin', value: 'round_robin' },
    { label: 'Least Connections', value: 'least_conn' },
    { label: 'IP Hash', value: 'ip_hash' }
  ]
</script>
