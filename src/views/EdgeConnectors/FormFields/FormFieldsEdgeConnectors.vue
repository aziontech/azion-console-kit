<template>
  <EdgeConnectorsFormFieldsGeneral
    :hiddenTitle="hiddenTitle"
    :noBorder="noBorder"
  />

  <EdgeConnectorsFormFieldsConnectorType />

  <EdgeConnectorsFormFieldsConnectionOptions />

  <EdgeConnectorsFormFieldsModules v-if="isHttpEnabled" />

  <EdgeConnectorsFormFieldsLoadBalancerConfiguration v-if="enableLoadBalancerConfiguration" />

  <EdgeConnectorsFormFieldsAddress v-if="isHttpEnabled" />

  <EdgeConnectorsFormFieldsOriginIpAcl v-if="originShieldEnabled" />

  <EdgeConnectorsFormFieldsHmac v-if="originShieldEnabled" />

  <EdgeConnectorsFormFieldsStatus />
</template>

<script setup>
  import EdgeConnectorsFormFieldsGeneral from './blocks/General.vue'
  import EdgeConnectorsFormFieldsConnectorType from './blocks/ConnectorType.vue'
  import EdgeConnectorsFormFieldsConnectionOptions from './blocks/ConnectionOptions.vue'
  import EdgeConnectorsFormFieldsModules from './blocks/Modules.vue'
  import EdgeConnectorsFormFieldsLoadBalancerConfiguration from './blocks/LoadBalancerConfiguration.vue'
  import EdgeConnectorsFormFieldsAddress from './blocks/Address.vue'
  import EdgeConnectorsFormFieldsOriginIpAcl from './blocks/OriginIpAcl.vue'
  import EdgeConnectorsFormFieldsHmac from './blocks/hmac.vue'
  import EdgeConnectorsFormFieldsStatus from './blocks/Status.vue'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'

  defineProps({
    hiddenTitle: {
      type: Boolean,
      default: false
    },
    noBorder: {
      type: Boolean,
      default: false
    }
  })

  const { value: originShieldEnabled } = useField('modules.originShield.enabled')
  const { value: loadBalancerEnabled } = useField('modules.loadBalancer.enabled')
  const { value: type } = useField('type')

  const isHttpEnabled = computed(() => type.value === 'http')
  const enableLoadBalancerConfiguration = computed(
    () => loadBalancerEnabled.value && isHttpEnabled.value
  )
</script>
