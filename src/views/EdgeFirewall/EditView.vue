<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEdgeFirewall from '@/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall'
  import * as yup from 'yup'
  defineOptions({ name: 'edit-edge-firewall' })

  const props = defineProps({
    editEdgeFirewallService: { type: Function, required: true },
    loadEdgeFirewallService: { type: Function, required: true },
    loadDomains: { type: Function, required: true },
    updatedRedirect: { type: String, required: true },
    showActionBar: { type: Boolean, default: false }
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    domains: yup.array().label('Domains'),
    isActive: yup.boolean().label('Active'),
    debugRules: yup.boolean().label('Debug Rules'),
    edgeFunctionsEnabled: yup.boolean().label('Edge Funcions Enabled'),
    networkProtectionEnabled: yup.boolean().label('Network Protection Enabled'),
    wafEnabled: yup.boolean().label('WAF Enabled')
  })
</script>

<template>
  <div>
    <EditFormBlock
      :editService="props.editEdgeFirewallService"
      :loadService="props.loadEdgeFirewallService"
      :updatedRedirect="updatedRedirect"
      :schema="validationSchema"
      :isTabs="true"
    >
      <template #form>
        <FormFieldsEdgeFirewall :domainsService="loadDomains" />
      </template>
      <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
        <ActionBarTemplate
          v-if="props.showActionBar"
          @onSubmit="onSubmit"
          @onCancel="onCancel"
          :loading="loading"
          :submitDisabled="!formValid"
        />
      </template>
    </EditFormBlock>
  </div>
</template>
