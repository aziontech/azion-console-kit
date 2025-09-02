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
          name="modules.loadBalancer.config.method"
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
          name="modules.loadBalancer.config.maxRetries"
          :value="maxRetries"
          :min="0"
          :max="20"
          description="Maximum number of retry attempts for failed connections. Value 0 for no retries. Valid range: 0-20."
          data-testid="edge-connectors-form__load-balancer-configuration__max-retries-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldNumber
          label="Connection Timeout"
          name="modules.loadBalancer.config.connectionTimeout"
          :value="connectionTimeout"
          :min="1"
          :max="300"
          description="Maximum time (in seconds) the Edge Connector will wait to establish a connection with the origin. Valid range: 1-300."
          data-testid="edge-connectors-form__load-balancer-configuration__connection-timeout-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-sm w-full gap-2">
        <FieldNumber
          label="Read/Write Timeout"
          name="modules.loadBalancer.config.readWriteTimeout"
          :value="readWriteTimeout"
          :min="1"
          :max="600"
          description="Maximum time (in seconds) the Edge Connector will wait for data to be read from or written to the origin. Valid range: 1-600."
          data-testid="edge-connectors-form__load-balancer-configuration__read-write-timeout-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import { watch } from 'vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'

  defineOptions({ name: 'EdgeConnectorsFormFieldsLoadBalancerConfiguration' })

  const { value: method } = useField('modules.loadBalancer.config.method')
  const { value: maxRetries } = useField('modules.loadBalancer.config.maxRetries')
  const { value: connectionTimeout } = useField('modules.loadBalancer.config.connectionTimeout')
  const { value: readWriteTimeout } = useField('modules.loadBalancer.config.readWriteTimeout')
  const { value: loadBalancerEnabled } = useField('modules.loadBalancer.enabled')

  const methodsList = [
    { label: 'Round Robin', value: 'round_robin' },
    { label: 'Least Connections', value: 'least_conn' },
    { label: 'IP Hash', value: 'ip_hash' }
  ]

  watch(
    () => loadBalancerEnabled.value,
    (newValue) => {
      if (newValue) {
        method.value = 'round_robin'
        maxRetries.value = 3
        connectionTimeout.value = 30
        readWriteTimeout.value = 60
      }
    },
    { immediate: true }
  )
</script>
