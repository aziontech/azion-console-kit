<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsEdgeConnectors from '../FormFields/FormFieldsEdgeConnectors'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
  import { validationSchema } from '../Config/validation'

  defineOptions({
    name: 'edge-connectors-drawer'
  })

  const emit = defineEmits(['onSuccess'])

  const showCreateEdgeConnectorsDrawer = ref(false)
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateEdgeConnectorsDrawer, debouncedDrawerAnimate)

  const initialValues = {
    name: '',
    type: 'http',
    active: true,
    connectionOptions: {
      host: '${host}',
      path: '',
      realIpHeader: 'X-Real-IP',
      realPortHeader: 'X-Real-PORT',
      followingRedirect: false,
      dnsResolution: 'both',
      transportPolicy: 'preserve',
      bucket: '',
      prefix: '/',
      region: 'us-east-1'
    },
    modules: {
      loadBalancer: {
        enabled: false,
        config: {
          method: 'round_robin',
          maxRetries: 0,
          connectionTimeout: 60,
          readWriteTimeout: 120
        }
      },
      originShield: {
        enabled: false,
        config: {
          originIpAcl: {
            enabled: true
          },
          hmac: {
            enabled: true,
            type: 'aws4_hmac_sha256',
            attributes: {
              region: '',
              service: '',
              accessKey: '',
              secretKey: ''
            }
          }
        }
      }
    },
    addresses: [
      {
        address: '',
        httpPort: 80,
        httpsPort: 443,
        serverRole: 'primary',
        weight: 1,
        active: true
      }
    ]
  }

  const closeCreateDrawer = () => {
    showCreateEdgeConnectorsDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateEdgeConnectorsDrawer.value = true
  }

  const handleCreateEdgeConnectors = (edgeConnectorResponse) => {
    emit('onSuccess', edgeConnectorResponse)
    closeCreateDrawer()
  }

  defineExpose({
    openCreateDrawer,
    showCreateEdgeConnectorsDrawer,
    showCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateEdgeConnectorsDrawer"
    :createService="edgeConnectorsService.createEdgeConnectorsService"
    id="create-edge-connectors-drawer"
    drawerId="create-edge-connectors-drawer"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateEdgeConnectors"
    title="Create Connector"
  >
    <template #formFields>
      <FormFieldsEdgeConnectors isDrawer />
    </template>
  </CreateDrawerBlock>
</template>
