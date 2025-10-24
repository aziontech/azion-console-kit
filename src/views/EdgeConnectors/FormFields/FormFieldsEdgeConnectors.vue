<template>
  <EdgeConnectorsFormFieldsGeneral
    :hiddenTitle="hiddenTitle"
    :noBorder="noBorder"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsConnectorType :isDrawer="isDrawer" />

  <EdgeConnectorsFormFieldsConnectionOptions :isDrawer="isDrawer" />

  <EdgeConnectorsFormFieldsModules
    v-if="isHttpEnabled"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsLoadBalancerConfiguration
    v-if="enableLoadBalancerConfiguration"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsAddress
    v-if="isHttpEnabled"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsOriginIpAcl
    v-if="originShieldEnabled"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsHmac
    v-if="originShieldEnabled"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsStatus :isDrawer="isDrawer" />
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
    },
    isDrawer: {
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
