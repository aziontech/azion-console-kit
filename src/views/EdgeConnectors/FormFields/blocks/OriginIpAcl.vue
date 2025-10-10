<template>
  <FormHorizontal
    title="Origin IP ACL"
    data-testid="edge-connectors-form__section__origin-ip-acl"
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="modules.originShield.config.originIpAcl.enabled"
          name="modules.originShield.config.originIpAcl.enabled"
          auto
          :isCard="false"
          :value="originIpAcl"
          title="Active"
          data-testid="edge-connectors-form__origin-ip-acl__origin-ip-acl-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  defineOptions({ name: 'EdgeConnectorsFormFieldsOriginIpAcl' })

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const { value: originIpAcl } = useField('modules.originShield.config.originIpAcl.enabled')
</script>
