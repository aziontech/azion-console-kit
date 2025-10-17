<template>
  <FormHorizontal
    title="Modules"
    description="Enable additional features to optimize traffic management and origin protection."
    data-testid="edge-connectors-form__section__modules"
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="modules.loadBalancer.enabled"
          name="modules.loadBalancer.enabled"
          :value="loadBalancer"
          title="Load Balancer"
          subtitle="Distribute traffic across multiple addresses with load balancing settings. Enabling this module unlocks support for multiple addresses and advanced traffic distribution configurations."
          data-testid="edge-connectors-form__modules__load-balance-enabled-field"
        />
      </div>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="modules.originShield.enabled"
          name="modules.originShield.enabled"
          :value="originShield"
          title="Origin Shield"
          subtitle="Protect your origin by centralizing requests through a shield location. Enabling this module also unlocks HMAC authentication settings for secure content delivery."
          data-testid="edge-connectors-form__modules__origin-shield-enabled-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  defineOptions({ name: 'EdgeConnectorsFormFieldsModules' })

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const { value: loadBalancer } = useField('modules.loadBalancer.enabled')
  const { value: originShield } = useField('modules.originShield.enabled')
</script>
