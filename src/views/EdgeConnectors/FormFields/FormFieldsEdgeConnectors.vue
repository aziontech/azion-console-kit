<template>
  <EdgeConnectorsFormFieldsGeneral
    :hiddenTitle="hiddenTitle"
    :noBorder="noBorder"
  />

  <EdgeConnectorsFormFieldsConnectorType />

  <EdgeConnectorsFormFieldsConnectionOptions />

  <EdgeConnectorsFormFieldsModules />

  <EdgeConnectorsFormFieldsLoadBalancerConfiguration />

  <EdgeConnectorsFormFieldsAddress />

  <EdgeConnectorsFormFieldsOriginIpAcl />

  <EdgeConnectorsFormFieldsMutualAuthenticationSettings />

  <EdgeConnectorsFormFieldsHmac />
</template>

<script setup>
  // import { onMounted, watch, computed } from 'vue'
  // import { useField, useFieldArray } from 'vee-validate'
  import EdgeConnectorsFormFieldsGeneral from './blocks/General.vue'
  import EdgeConnectorsFormFieldsConnectorType from './blocks/ConnectorType.vue'
  import EdgeConnectorsFormFieldsConnectionOptions from './blocks/ConnectionOptions.vue'
  import EdgeConnectorsFormFieldsModules from './blocks/Modules.vue'
  import EdgeConnectorsFormFieldsLoadBalancerConfiguration from './blocks/LoadBalancerConfiguration.vue'
  import EdgeConnectorsFormFieldsAddress from './blocks/Address.vue'
  import EdgeConnectorsFormFieldsOriginIpAcl from './blocks/OriginIpAcl.vue'
  import EdgeConnectorsFormFieldsMutualAuthenticationSettings from './blocks/MutualAuthenticationSettings.vue'
  import EdgeConnectorsFormFieldsHmac from './blocks/hmac.vue'

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

  // const types = ref([
  //   { label: 'HTTP', value: 'http' },
  //   { label: 'S3', value: 's3' },
  //   { label: 'Edge Storage', value: 'edge_storage' },
  //   { label: 'Live Ingest', value: 'live_ingest' }
  // ])

  // const loadBalancerMethods = ref([
  //   { label: 'Off', value: 'off' },
  //   { label: 'IP Hash', value: 'ip_hash' },
  //   { label: 'Least Connections', value: 'least_connections' },
  //   { label: 'Round Robin', value: 'round_robin' }
  // ])

  // const tlsRadioOptions = ref([
  //   { title: 'Preserve', inputValue: 'preserve' },
  //   { title: 'Off', inputValue: 'off' },
  //   { title: 'On', inputValue: 'on' }
  // ])

  // const connectionPreferences = ref([
  //   { label: 'IPv6', value: 'IPv6' },
  //   { label: 'IPv4', value: 'IPv4' }
  // ])

  // const liveIngestEndpoints = ref([
  //   { label: 'us-east-1.azioningest.net', value: 'us-east-1.azioningest.net' },
  //   { label: 'br-east-1.azioningest.net', value: 'br-east-1.azioningest.net' },
  //   { label: 'br-east-2.azioningest.net', value: 'br-east-2.azioningest.net' },
  //   { label: 'us-east-2.azioningest.net', value: 'us-east-2.azioningest.net' },
  //   { label: 'br-east-3.azioningest.net', value: 'br-east-3.azioningest.net' }
  // ])

  // const { value: type } = useField('type')
  // const { value: loadBalanceMethod } = useField('loadBalanceMethod')
  // const { value: tlsPolicy } = useField('tlsPolicy')
  // const { value: connectionTimeout } = useField('connectionTimeout')
  // const { value: readWriteTimeout } = useField('readWriteTimeout')
  // const { value: maxRetries } = useField('maxRetries')
  // const { value: connectionPreference } = useField('connectionPreference')
  // const {
  //   push: pushAddresses,
  //   remove: removeAddressesArray,
  //   fields: addresses
  // } = useFieldArray('addresses')
  // const { value: status } = useField('status')
  // const { value: loadBalancerEnabled } = useField('loadBalancerEnabled')
  // const { value: originShieldEnabled } = useField('originShieldEnabled')

  // // http
  // const { value: host } = useField('http.host')
  // const { value: path } = useField('http.path')
  // const { value: followingRedirect } = useField('http.followingRedirect')
  // const { value: realIpHeader } = useField('http.realIpHeader')
  // const { value: realPortHeader } = useField('http.realPortHeader')

  // // s3
  // const { value: s3Host } = useField('s3.host')
  // const { value: s3Bucket } = useField('s3.bucket')
  // const { value: s3Path } = useField('s3.path')
  // const { value: s3Region } = useField('s3.region')
  // const { value: s3AccessKey } = useField('s3.accessKey')
  // const { value: s3SecretKey } = useField('s3.secretKey')

  // // edge_storage
  // const { value: edgeStorageBucket } = useField('edgeStorage.bucket')
  // const { value: edgeStoragePrefix } = useField('edgeStorage.prefix')

  // // live_ingest
  // const { value: liveIngestEndpoint } = useField('liveIngestEndpoint')

  // const serversRoles = computed(() => {
  //   if (loadBalanceMethod.value === 'ip_hash') {
  //     return [{ label: 'Primary', value: 'primary' }]
  //   }

  //   return [
  //     { label: 'Primary', value: 'primary' },
  //     { label: 'Backup', value: 'backup' }
  //   ]
  // })

  // onMounted(() => {
  //   addNewAddresses()
  // })

  // const addNewAddresses = () => {
  //   pushAddresses({
  //     address: '',
  //     plainPort: 80,
  //     tlsPort: 443,
  //     serverRole: 'primary',
  //     weight: 1,
  //     active: true,
  //     maxConns: 0,
  //     maxFails: 1,
  //     failTimeout: 10
  //   })
  // }

  // const removeAddresses = (index) => {
  //   removeAddressesArray(index)
  // }

  // watch(loadBalancerEnabled, () => {
  //   if (!loadBalancerEnabled.value) {
  //     // eslint-disable-next-line id-length
  //     const newArray = addresses.value.filter((_, index) => index === 0)
  //     addresses.value = newArray
  //     loadBalanceMethod.value = 'off'
  //   }
  // })

  // watch(originShieldEnabled, () => {
  //   if (!originShieldEnabled.value) {
  //     tlsPolicy.value = 'preserve'
  //   }
  // })
</script>
