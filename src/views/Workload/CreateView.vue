<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Workload"
        description="Configure domains, protocols, certificates, and select the security and application settings executed by this Workload."
      ></PageHeadingBlock>
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
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { validationSchema } from './Config/validation'

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
    application: null,
    active: true,
    infrastructure: '1',
    firewall: null,
    tls: {
      certificate: 0,
      ciphers: 7,
      minimumVersion: 'tls_1_3'
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
</script>
