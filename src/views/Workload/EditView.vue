<template>
  <EditFormBlock
    :editService="editWorkloadService"
    :loadService="loadWorkload"
    :schema="validationSchema"
    :updatedRedirect="updatedRedirect"
    @loaded-service-object="setWorkloadName"
    @on-edit-success="handleTrackEditEvent"
    @on-edit-fail="handleTrackFailEditEvent"
    isTabs
  >
    <template #form>
      <FormFieldsWorkload
        isEdit
        :edgeApplicationServices="props.edgeApplicationServices"
        :edgeFirewallServices="props.edgeFirewallServices"
        :digitalCertificatesServices="props.digitalCertificatesServices"
        :customPagesServices="props.customPagesServices"
      />
    </template>
    <template #action-bar="{ onSubmit, onCancel, loading }">
      <ActionBarTemplate
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
      />
    </template>
  </EditFormBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsWorkload from './FormFields/FormFieldsWorkload.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    updatedRedirect: {
      type: String,
      required: true
    },
    edgeApplicationServices: {
      type: Object,
      required: true
    },
    edgeFirewallServices: {
      type: Object,
      required: true
    },
    digitalCertificatesServices: {
      type: Object,
      required: true
    },
    customPagesServices: {
      type: Object,
      required: true
    },
    workload: {
      type: Object,
      required: true
    }
  })

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Workload'
    })
  }

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Workload',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const workloadName = ref()

  const setWorkloadName = async (workload) => {
    workloadName.value = workload.name
  }

  const loadWorkload = () => {
    return props.workload
  }

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
    edgeApplication: yup.number().required().label('Edge Application'),
    active: yup.boolean(),
    networkMap: yup.string(),
    infrastructure: yup.string(),
    edgeFirewall: yup.number().label('Edge Firewall').nullable(),
    tls: yup.object({
      isEnabled: yup.boolean(),
      certificate: yup.string(),
      ciphers: yup.string(),
      minimumVersion: yup.string()
    }),
    protocols: yup.object({
      http: yup.object({
        useHttps: yup.boolean(),
        useHttp3: yup.boolean(),
        versions: yup.array(),
        httpPorts: yup.array().when('useHttp3', {
          is: true,
          then: (schema) => schema.min(1, 'At least one port is required'),
          otherwise: (schema) => schema.notRequired()
        }),
        httpsPorts: yup.array().when('useHttps', {
          is: true,
          then: (schema) => schema.min(1, 'At least one port is required'),
          otherwise: (schema) => schema.notRequired()
        }),
        quicPorts: yup.array().when('useHttp3', {
          is: true,
          then: (schema) => schema.min(1, 'At least one port is required'),
          otherwise: (schema) => schema.notRequired()
        })
      })
    }),
    mtls: yup.object({
      verification: yup.string().label('Verification'),
      certificate: yup
        .string()
        .when('isEnabled', {
          is: true,
          then: (schema) => schema.required()
        })
        .label('Trusted CA Certificate'),
      crl: yup.array().label('Certificate Revocation List')
    }),
    domains: yup
      .array()
      .of(
        yup.object({
          id: yup.number(),
          subdomain: yup
            .string()
            .test('valid-subdomain', 'Invalid Subdomain format', function (value) {
              if (!value) return true // Allow empty subdomain
              return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(value)
            })
            .label('Subdomain'),
          domain: yup
            .string()
            .test('valid-domain', 'Invalid Domain format', function (value) {
              if (!value) return true // Allow empty domain
              // Regex para validar domínio: deve conter letras/números, ponto e TLD
              return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(value)
            })
            .label('Domain')
        })
      )
      .when('workloadHostnameAllowAccess', {
        is: false,
        then: (schema) =>
          schema.test(
            'has-filled-domain',
            'At least one domain with subdomain and domain is required',
            (value) => value?.some((domain) => domain.subdomain && domain.domain)
          )
      }),
    useCustomDomain: yup.boolean(),
    customDomain: yup
      .string()
      .when('useCustomDomain', {
        is: true,
        then: (schema) =>
          schema
            .required()
            .test('valid-custom-domain', 'Invalid custom domain format', function (value) {
              if (!value) return true // Allow empty hostname
              return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(value)
            })
      })
      .label('Custom Domain'),
    workloadHostnameAllowAccess: yup.boolean()
  })
</script>
