<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="New Rule Set"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createEdgeFirewallServices"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormCreateEdgeFirewall :domainsService="props.listDomainsService" />
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
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormCreateEdgeFirewall from './FormFields/FormFieldsEdgeFirewall'
  import * as yup from 'yup'
  defineOptions({ name: 'create-edge-firewall' })

  const props = defineProps({
    createEdgeFirewallServices: {
      type: Function,
      required: true
    },
    listDomainsService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    domains: yup.array().label('Domains'),
    isActive: yup.boolean().label('Active'),
    edgeFunctionsEnabled: yup.boolean().label('Edge Funcions Enabled'),
    networkProtectionEnabled: yup.boolean().label('Network Protection Enabled'),
    wafEnabled: yup.boolean().label('WAF Enabled')
  })

  

  const initialValues = {
    name: '',
    domains: domainsaa,
    isActive: true,
    edgeFunctionsEnabled: false,
    networkProtectionEnabled: false,
    wafEnabled: false
  }
</script>
