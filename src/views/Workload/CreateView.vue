<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Workload"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="workloadService.createWorkload"
        disableToast
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableAfterCreateToastFeedback
      >
        <template #form>
          <FormFieldsWorkload />
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
  import { inject } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsWorkload from './FormFields/FormFieldsWorkload.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { workloadService } from '@/services/v2'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()

  const handleResponse = (response) => {
    handleToast(response)
    tracker.product.productCreated({
      productName: 'Domain',
      createdFrom: 'singleEntity',
      from: route.query.origin
    })
  }

  const handleToast = (response) => {
    const toast = {
      feedback: response.feedback,
      actions: {
        link: {
          label: 'View Workload',
          callback: () => response.redirectToUrl(response.urlToEditView)
        },
        secondary: {
          label: 'Copy Workload URL',
          icon: 'pi pi-copy',
          animation: {
            time: 3000,
            icon: 'pi pi-check',
            label: 'Copied'
          },
          callback: () => props.clipboardWrite(response.domainName)
        }
      }
    }
    response.showToastWithActions(toast)
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Domains',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const initialValues = {
    name: '',
    edgeApplication: null,
    active: true,
    infrastructure: '1',
    edgeFirewall: null,
    tls: {
      certificate: 0,
      ciphers: 7,
      minimumVersion: 'tls_1_2'
    },
    protocols: {
      http: {
        useHttps: true,
        useHttp3: true,
        httpPorts: [{ name: '80 (Default)', value: 80 }],
        httpsPorts: [{ name: '443 (Default)', value: 443 }],
        quicPorts: [{ name: '443 (Default)', value: 443 }]
      }
    },
    mtls: {
      isEnabled: false,
      verification: 'enforce',
      certificate: null,
      crl: []
    },
    domains: [
      {
        subdomain: '',
        domain: ''
      }
    ],
    workloadHostnameAllowAccess: true,
    useCustomDomain: false,
    customDomain: ''
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
    workloadHostnameAllowAccess: yup.boolean(),
    letEncrypt: yup.object({
      commonName: yup.string(),
      alternativeNames: yup.array()
    })
  })
</script>
