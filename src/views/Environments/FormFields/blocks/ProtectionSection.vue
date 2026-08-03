<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldTextArea from '@aziontech/webkit/field-text-area'

  defineOptions({ name: 'environment-form-protection-section' })

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    }
  })

  const { value: ipAllowlistEnabled } = useField('protection.ip_allowlist.enabled')
  const { value: ipAllowlistCidrs } = useField('protection.ip_allowlist.cidrs')
</script>

<template>
  <FormHorizontal
    title="Protection"
    description="Restrict who can reach this environment. Each protection can be enabled independently."
    data-testid="environment-form__section__protection"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-6">
        <div class="flex flex-col w-full gap-2">
          <FieldSwitchBlock
            nameField="protection.ip_allowlist.enabled"
            name="protection.ip_allowlist.enabled"
            auto
            :isCard="false"
            :value="ipAllowlistEnabled"
            :disabled="props.disabledFields"
            title="IP Allowlist"
            subtitle="Only allow access from the listed IPs or CIDR ranges."
            data-testid="environment-form__protection__ip-allowlist-field"
          />
          <div
            v-if="ipAllowlistEnabled"
            class="flex flex-col sm:max-w-lg w-full gap-2"
          >
            <FieldTextArea
              label="IPs/CIDRs"
              name="protection.ip_allowlist.cidrs"
              rows="6"
              cols="30"
              placeholder="192.168.1.0/24&#10;10.0.0.1&#10;2001:db8::/32"
              :value="ipAllowlistCidrs"
              :disabled="props.disabledFields"
              data-testid="environment-form__protection__ip-allowlist-cidrs-field"
            >
              <template #description>
                <small class="text-xs text-color-secondary font-normal leading-5">
                  Add IPv4 or IPv6 addresses or CIDR ranges (e.g., 192.168.1.0/24). Enter one entry
                  per line. Duplicated entries are automatically removed.
                </small>
              </template>
            </FieldTextArea>
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
