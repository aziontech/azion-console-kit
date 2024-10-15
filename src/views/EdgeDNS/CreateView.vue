<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Zone"
        description="Set Azion Edge DNS as the authoritative DNS server for a domain by copying the nameservers values."
      >
        <template #default>
          <PrimeButton
            outlined
            icon="pi pi-copy"
            class="max-md:w-full"
            label="Copy Nameserver Values"
            @click="handleCopyNameServers"
          ></PrimeButton>
        </template>
      </PageHeadingBlock>
    </template>

    <template #content>
      <CreateFormBlock
        :createService="props.createEdgeDNSService"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleResponse"
        @on-response-fail="handleTrackFailedCreation"
      >
        <template #form>
          <FormFieldsEdgeDnsCreate></FormFieldsEdgeDnsCreate>
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
  import CreateFormBlock from '@templates/create-form-block'
  import FormFieldsEdgeDnsCreate from './FormFields/FormFieldsEdgeDns.vue'
  import * as yup from 'yup'
  import PrimeButton from 'primevue/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useToast } from 'primevue/usetoast'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    createEdgeDNSService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const toast = useToast()

  const validationSchema = yup.object({
    name: yup.string().required(),
    domain: yup
      .string()
      .required()
      .test('valid-domain', 'Invalid domain', function (value) {
        const domainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/
        return domainRegex.test(value)
      }),
    isActive: yup.boolean()
  })

  const initialValues = {
    name: '',
    domain: '',
    isActive: true
  }

  const handleCopyNameServers = () => {
    props.clipboardWrite('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    })
  }

  const handleResponse = () => {
    tracker.product.productCreated({
      productName: 'Edge DNS Zone'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Edge DNS Zone',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
