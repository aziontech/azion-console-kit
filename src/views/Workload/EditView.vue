<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="workloadName" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="workloadService.editWorkload"
        :loadService="workloadService.loadWorkload"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
        @loaded-service-object="setWorkloadName"
        @on-edit-success="handleTrackEditEvent"
        @on-edit-fail="handleTrackFailEditEvent"
      >
        <template #form>
          <FormFieldsWorkload isEdit />
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
  </ContentBlock>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsWorkload from './FormFields/FormFieldsWorkload.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { workloadService } from '@/services/v2'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineProps({
    updatedRedirect: { type: String, required: true }
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
      isEnabled: yup.boolean(),
      verification: yup.string().nullable().notRequired().label('Verification'),
      certificate: yup
        .string()
        .when('isEnabled', {
          is: true,
          then: (schema) => schema.required('Trusted CA Certificate is required'),
          otherwise: (schema) => schema.notRequired().nullable()
        })
        .label('Trusted CA Certificate'),
      crl: yup
        .array()
        .when('isEnabled', {
          is: true,
          then: (schema) => schema.required('Certificate Revocation List is required').min(1),
          otherwise: (schema) => schema.nullable().notRequired()
        })
        .label('Certificate Revocation List')
    }),
    domains: yup
      .array()
      .of(
        yup.object({
          id: yup.number(),
          subdomain: yup
            .string()
            .test('valid-subdomain', 'Invalid Subdomain format', function (value) {
              if (!value) return true

              if (value.endsWith('.')) return false

              const dotCount = (value.match(/\./g) || []).length
              if (dotCount > 10) return false

              const segments = value.split('.')
              return segments.every((segment) =>
                /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(segment)
              )
            })
            .label('Subdomain'),
          domain: yup
            .string()
            .test('valid-domain', 'Invalid Domain format', function (value) {
              if (!value) return true // Allow empty domain
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
      .nullable()
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
    workloadHostnameAllowAccess: yup.boolean(),
    letEncrypt: yup.object({
      commonName: yup.string(),
      alternativeNames: yup.array()
    }),
    authorityCertificate: yup.string()
  })
</script>
