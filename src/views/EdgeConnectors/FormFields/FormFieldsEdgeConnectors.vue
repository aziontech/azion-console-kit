<template>
  <EdgeConnectorsFormFieldsGeneral
    :hiddenTitle="hiddenTitle"
    :noBorder="noBorder"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsConnectorType :isDrawer="isDrawer" />

  <EdgeConnectorsFormFieldsConnectionOptions
    :isDrawer="isDrawer"
    :isLoadingData="isLoadingData"
    :cachedHost="cachedHost"
  />

  <EdgeConnectorsFormFieldsModules
    v-if="isHttpEnabled"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsLoadBalancerConfiguration
    :class="{
      hidden: !enableLoadBalancerConfiguration
    }"
    :isDrawer="isDrawer"
  />

  <EdgeConnectorsFormFieldsAddress
    :class="{
      hidden: !isHttpEnabled
    }"
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
  import { computed } from 'vue'
  import { useField } from 'vee-validate'
  import EdgeConnectorsFormFieldsGeneral from '@/views/EdgeConnectors/FormFields/blocks/General.vue'
  import EdgeConnectorsFormFieldsConnectorType from '@/views/EdgeConnectors/FormFields/blocks/ConnectorType.vue'
  import EdgeConnectorsFormFieldsConnectionOptions from '@/views/EdgeConnectors/FormFields/blocks/ConnectionOptions.vue'
  import EdgeConnectorsFormFieldsModules from '@/views/EdgeConnectors/FormFields/blocks/Modules.vue'
  import EdgeConnectorsFormFieldsLoadBalancerConfiguration from '@/views/EdgeConnectors/FormFields/blocks/LoadBalancerConfiguration.vue'
  import EdgeConnectorsFormFieldsAddress from '@/views/EdgeConnectors/FormFields/blocks/Address.vue'
  import EdgeConnectorsFormFieldsOriginIpAcl from '@/views/EdgeConnectors/FormFields/blocks/OriginIpAcl.vue'
  import EdgeConnectorsFormFieldsHmac from '@/views/EdgeConnectors/FormFields/blocks/hmac.vue'
  import EdgeConnectorsFormFieldsStatus from '@/views/EdgeConnectors/FormFields/blocks/Status.vue'

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
    },
    isLoadingData: {
      type: Boolean,
      default: false
    },
    cachedHost: {
      type: String,
      default: null
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
