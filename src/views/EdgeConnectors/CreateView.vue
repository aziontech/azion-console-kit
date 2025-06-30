<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Edge Connectors" />
    </template>
    <template #content>
      <CreateFormBlock
        @on-response="handleToast"
        :createService="edgeConnectorsService.createEdgeConnectorsService"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableToast
      >
        <template #form="{ resetForm }">
          <FormFieldsEdgeConnectors
            :initialValues="initialValues"
            :schema="validationSchema"
            :resetForm="resetForm"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsEdgeConnectors from './FormFields/FormFieldsEdgeConnectors.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { validationSchema } from './composables/validation'
  import { edgeConnectorsService } from '@/services/v2'

  const initialValues = {
    name: '',
    type: 'http',
    connectionOptions: {
      host: '',
      pathPrefix: '',
      realIpHeader: '',
      realPortHeader: '',
      followingRedirect: true,
      dnsResolution: true,
      transportPolicy: 'http'
    },
    modules: {
      loadBalancerEnabled: false,
      originShieldEnabled: false
    },
    loaderBalancerConfiguration: {
      method: 'round_robin',
      maxRetries: 0,
      connectionTimeout: 60,
      readWriteTimeout: 120
    },
    addresses: [],
    address: {
      address: '',
      tlsPort: 80,
      plainPort: 80
    },
    originIpAcl: true,
    mtls: {
      active: true,
      config: {
        certificate: null,
        crl: []
      }
    },
    hmac: {
      active: true,
      type: 'aws4_hmac_sha256',
      attributes: {
        region: '',
        service: '',
        accessKey: '',
        secretKey: ''
      }
    }
  }

  const handleToast = (response) => {
    const toast = {
      feedback: 'Edge Connector successfully created',
      actions: {
        link: {
          label: 'View Edge Connector',
          callback: () => response.redirectToUrl(`/edge-connectors/edit/${response.data.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }
</script>
