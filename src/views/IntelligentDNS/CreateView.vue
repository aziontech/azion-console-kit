<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Intelligent DNS"
        description="Copy the Nameservers values for change your domain's authoritative DNS servers to use Azion Intelligent DNS."
      >
        <template #default>
          <PrimeButton
            outlined
            icon="pi pi-copy"
            class="max-md:w-full"
            label="Copy Nameservers"
            @click="handleCopyNameServers"
          ></PrimeButton>
        </template>
      </PageHeadingBlock>
    </template>

    <template #content>
      <CreateFormBlock
        :createService="props.createIntelligentDNSService"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsIntelligentDnsCreate></FormFieldsIntelligentDnsCreate>
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@templates/create-form-block'
  import FormFieldsIntelligentDnsCreate from './FormFields/FormFieldsIntelligentDns.vue'
  import * as yup from 'yup'
  import PrimeButton from 'primevue/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useToast } from 'primevue/usetoast'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  const props = defineProps({
    createIntelligentDNSService: {
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
    isActive: yup.boolean().default(true)
  })

  const handleCopyNameServers = () => {
    props.clipboardWrite('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
    toast.add({
      closable: false,
      severity: 'success',
      summary: 'Nameservers copied',
      life: 10000
    })
  }
</script>
