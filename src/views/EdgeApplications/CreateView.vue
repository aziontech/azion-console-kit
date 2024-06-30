<template>
  <ContentBlock data-testid="create-edge-application-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Edge Application"
        data-testid="create-edge-application-heading"
      />
    </template>
    <template #content>
      <CreateFormBlock
        @on-response="handleTrackCreation"
        @on-response-fail="handleTrackFailedCreation"
        :createService="props.createEdgeApplicationService"
        :schema="validationSchema"
        :initialValues="initialValues"
        data-testid="create-edge-application-form-block"
      >
        <template #form>
          <FormFieldsCreateEdgeApplications
            :handleBlock="handleBlocks"
            data-testid="create-edge-application-form-fields"
          />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            data-testid="create-edge-application-action-bar"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import { inject, ref } from 'vue'
  import * as yup from 'yup'
  import FormFieldsCreateEdgeApplications from './FormFields/FormFieldsCreateEdgeApplications'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  const tracker = inject('tracker')
  import { useRoute } from 'vue-router'
  const route = useRoute()

  const props = defineProps({
    createEdgeApplicationService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required(),
    address: yup.string().required(),
    hostHeader: yup.string().required(),
    cdnCacheSettingsMaximumTtl: yup.string().required(),
    httpPort: yup.array().when('deliveryProtocol', {
      is: (deliveryProtocol) => deliveryProtocol?.includes('http'),
      then: (schema) => schema.min(1).required()
    }),
    httpsPort: yup.array().when('deliveryProtocol', {
      is: (deliveryProtocol) => deliveryProtocol?.includes('https'),
      then: (schema) => schema.min(1).required()
    })
  })

  const initialValues = ref({
    name: '',
    deliveryProtocol: 'http',
    http3: false,
    httpPort: [{ name: '80 (Default)', value: '80' }],
    httpsPort: [{ name: '443 (Default)', value: '443' }],
    minimumTlsVersion: 'none',
    supportedCiphers: 'all',
    originType: 'single_origin',

    address: '',
    originProtocolPolicy: 'preserve',
    hostHeader: '${host}',
    browserCacheSettings: 'override',
    browserCacheSettingsMaximumTtl: 0,
    cdnCacheSettings: 'override',
    cdnCacheSettingsMaximumTtl: 60,
    debugRules: false
  })

  const handleBlocks = [
    'general',
    'delivery-settings',
    'default-origins',
    'cache-expiration-policies',
    'debug-rules'
  ]

  const handleTrackCreation = () => {
    tracker.product.productCreated({
      productName: 'Edge Application',
      from: route.query.origin,
      createdFrom: 'singleEntity'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Edge Application',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
