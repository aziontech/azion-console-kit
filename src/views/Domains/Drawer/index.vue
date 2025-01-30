<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import { ref, inject, defineExpose } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { createDomainService } from '@/services/domains-services/v4'
  import {
    listEdgeApplicationsService,
    loadEdgeApplicationsService
  } from '@/services/edge-application-services/v4'
  import {
    listEdgeFirewallService,
    loadEdgeFirewallService
  } from '@/services/edge-firewall-services/v4'
  import {
    loadDigitalCertificateService,
    listDigitalCertificatesServiceDropdown
  } from '@/services/digital-certificates-services/v4'
  import FormFieldsCreateDomains from '../FormFields/FormFieldsCreateDomains.vue'
  import { useRoute } from 'vue-router'

  defineOptions({
    name: 'domain-drawer'
  })
  const emit = defineEmits(['onSuccess'])

  /**@type {import('@/plugins/adapters/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const showCreateDomainDrawer = ref(false)
  const DEBOUNCE_TIME_IN_MS = 300
  const showCreateDrawer = refDebounced(showCreateDomainDrawer, DEBOUNCE_TIME_IN_MS)
  const route = useRoute()
  const edgeApplicationId = ref(route.params.id)

  const validationSchema = yup.object({
    name: yup
      .string()
      .label('Name')
      .required()
      .test(
        'only-ascii',
        'Invalid characters. Use letters, numbers, and standard symbols, with no accents.',
        function (value) {
          const nameRegex = /^[\x20-\x21\x23-\x7E]+$/
          return nameRegex.test(value)
        }
      ),
    edgeApplication: yup.number().label('Edge Application'),
    cnames: yup
      .string()
      .label('CNAME')
      .when('cnameAccessOnly', {
        is: true,
        then: (schema) => schema.required()
      })
      .test({
        name: 'no-whitespace',
        message: `Space characters aren't allowed.`,
        test: (value) => value?.includes(' ') === false
      }),
    httpsPort: yup.array().when('useHttps', {
      is: true,
      then: (schema) => schema.min(1, 'At least one port is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    minimumTlsVersion: yup.string().when('useHttps', {
      is: true,
      then: (schema) => schema.required().label('TLS Version'),
      otherwise: (schema) => schema.notRequired()
    }),
    httpPort: yup.array().min(1).required(),
    quicPort: yup.array().when('useHtpp3', {
      is: true,
      then: (schema) => schema.min(1, 'At least one port is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    cnameAccessOnly: yup.boolean(),
    edgeCertificate: yup.string().optional(),
    mtlsIsEnabled: yup.boolean(),
    mtlsVerification: yup.string(),
    mtlsTrustedCertificate: yup
      .string()
      .when('mtlsIsEnabled', {
        is: true,
        then: (schema) => schema.required()
      })
      .label('Trusted CA Certificate'),
    active: yup.boolean(),
    environment: yup.string()
  })

  const initialValues = {
    name: '',
    environment: '1',
    edgeApplication: parseInt(edgeApplicationId.value),
    edgeFirewall: null,
    deliveryProtocol: 'https',
    httpPort: [{ name: '80 (Default)', value: 80 }],
    httpsPort: [{ name: '443 (Default)', value: 443 }],
    quicPort: [{ name: '443 (Default)', value: 443 }],
    minimumTlsVersion: 'tls_1_2',
    useHttps: false,
    useHttp3: false,
    cnames: '',
    cnameAccessOnly: true,
    mtlsIsEnabled: false,
    mtlsVerification: 'enforce',
    active: true
  }

  const handleTrackCreation = () => {
    tracker.product.productCreated({
      productName: 'Domain'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Domain',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const closeCreateDrawer = () => {
    showCreateDomainDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateDomainDrawer.value = true
  }
  const handleCreateWithSuccess = (response) => {
    handleTrackCreation()
    emit('onSuccess', response.id)
    closeCreateDrawer()
  }
  defineExpose({
    showCreateDrawer,
    openCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    data-testid="domain-drawer"
    v-model:visible="showCreateDomainDrawer"
    :createService="createDomainService"
    :schema="validationSchema"
    :initialValues="initialValues"
    drawerId="domain-drawer"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Create Domain"
  >
    <template #formFields>
      <FormFieldsCreateDomains
        :listEdgeFirewallService="listEdgeFirewallService"
        :loadEdgeFirewallService="loadEdgeFirewallService"
        :listDigitalCertificatesService="listDigitalCertificatesServiceDropdown"
        :loadDigitalCertificatesService="loadDigitalCertificateService"
        :loadEdgeApplicationsService="loadEdgeApplicationsService"
        :listEdgeApplicationsService="listEdgeApplicationsService"
        :disabledEdgeApplicationDropdown="true"
      />
    </template>
  </CreateDrawerBlock>
</template>
