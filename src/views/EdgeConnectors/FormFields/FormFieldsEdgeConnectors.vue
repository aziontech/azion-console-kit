<template>
  <EdgeConnectorsFormFieldsGeneral
    :hiddenTitle="hiddenTitle"
    :noBorder="noBorder"
  />

  <EdgeConnectorsFormFieldsConnectorType />

  <EdgeConnectorsFormFieldsConnectionOptions />

  <EdgeConnectorsFormFieldsModules v-if="type === 'http'" />

  <EdgeConnectorsFormFieldsLoadBalancerConfiguration v-if="type === 'http'" />

  <EdgeConnectorsFormFieldsAddress v-if="type === 'http'" />

  <EdgeConnectorsFormFieldsOriginIpAcl v-if="originShieldEnabled" />

  <!-- <EdgeConnectorsFormFieldsMutualAuthenticationSettings v-if="originShieldEnabled" /> -->
  <EdgeConnectorsFormFieldsHmac v-if="originShieldEnabled" />
</template>

<script setup>
  import EdgeConnectorsFormFieldsGeneral from './blocks/General.vue'
  import EdgeConnectorsFormFieldsConnectorType from './blocks/ConnectorType.vue'
  import EdgeConnectorsFormFieldsConnectionOptions from './blocks/ConnectionOptions.vue'
  import EdgeConnectorsFormFieldsModules from './blocks/Modules.vue'
  import EdgeConnectorsFormFieldsLoadBalancerConfiguration from './blocks/LoadBalancerConfiguration.vue'
  import EdgeConnectorsFormFieldsAddress from './blocks/Address.vue'
  import EdgeConnectorsFormFieldsOriginIpAcl from './blocks/OriginIpAcl.vue'
  // import EdgeConnectorsFormFieldsMutualAuthenticationSettings from './blocks/MutualAuthenticationSettings.vue'
  import EdgeConnectorsFormFieldsHmac from './blocks/hmac.vue'
  import { useField } from 'vee-validate'

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
  const { value: type } = useField('type')
</script>
