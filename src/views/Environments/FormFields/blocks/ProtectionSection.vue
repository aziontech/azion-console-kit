<script setup>
  import { computed } from 'vue'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldTextArea from '@aziontech/webkit/field-text-area'
  import LabelBlock from '@aziontech/webkit/label'
  import TextArea from 'primevue/textarea'

  defineOptions({ name: 'environment-form-protection-section' })

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    }
  })

  const { value: azionAuthenticationEnabled } = useField('protection.azion_authentication.enabled')
  const { value: passwordProtectionEnabled } = useField('protection.password_protection.enabled')
  const { value: passwordProtectionSecretId } = useField('protection.password_protection.secret_id')
  const { value: ipAllowlistEnabled } = useField('protection.ip_allowlist.enabled')
  const { value: ipAllowlistCidrs } = useField('protection.ip_allowlist.cidrs')
  const { value: ssoEnforcementEnabled } = useField('protection.sso_enforcement.enabled')
  const { value: ssoEnforcementIdpId } = useField('protection.sso_enforcement.idp_id')
  const { value: ssoEnforcementAllowedDomains } = useField(
    'protection.sso_enforcement.allowed_domains'
  )

  const allowedDomainsText = computed({
    get: () =>
      Array.isArray(ssoEnforcementAllowedDomains.value)
        ? ssoEnforcementAllowedDomains.value.join('\n')
        : '',
    set: (value) => {
      ssoEnforcementAllowedDomains.value = String(value ?? '').split('\n')
    }
  })
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
            nameField="protection.azion_authentication.enabled"
            name="protection.azion_authentication.enabled"
            auto
            :isCard="false"
            :value="azionAuthenticationEnabled"
            :disabled="props.disabledFields"
            title="Azion Authentication"
            subtitle="Require Azion account authentication to access the environment."
            data-testid="environment-form__protection__azion-authentication-field"
          />
        </div>

        <div class="flex flex-col w-full gap-2">
          <FieldSwitchBlock
            nameField="protection.password_protection.enabled"
            name="protection.password_protection.enabled"
            auto
            :isCard="false"
            :value="passwordProtectionEnabled"
            :disabled="props.disabledFields"
            title="Password Protection"
            subtitle="Require a shared secret to access the environment."
            data-testid="environment-form__protection__password-protection-field"
          />
          <div
            v-if="passwordProtectionEnabled"
            class="flex flex-col sm:max-w-lg w-full gap-2"
          >
            <FieldText
              label="Secret"
              name="protection.password_protection.secret_id"
              placeholder="Secret ID"
              description="Reference to the secret used for password protection."
              :value="passwordProtectionSecretId"
              :disabled="props.disabledFields"
              data-testid="environment-form__protection__password-protection-secret-field"
            />
          </div>
        </div>

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

        <div class="flex flex-col w-full gap-2">
          <FieldSwitchBlock
            nameField="protection.sso_enforcement.enabled"
            name="protection.sso_enforcement.enabled"
            auto
            :isCard="false"
            :value="ssoEnforcementEnabled"
            :disabled="props.disabledFields"
            title="SSO Enforcement"
            subtitle="Require single sign-on through an identity provider."
            data-testid="environment-form__protection__sso-enforcement-field"
          />
          <div
            v-if="ssoEnforcementEnabled"
            class="flex flex-col sm:max-w-lg w-full gap-4"
          >
            <FieldText
              label="Identity Provider"
              name="protection.sso_enforcement.idp_id"
              placeholder="Identity Provider ID"
              description="Reference to the identity provider used to enforce SSO."
              :value="ssoEnforcementIdpId"
              :disabled="props.disabledFields"
              data-testid="environment-form__protection__sso-enforcement-idp-field"
            />
            <div class="flex flex-col w-full gap-2">
              <LabelBlock
                for="protection.sso_enforcement.allowed_domains"
                label="Allowed Domains"
                description="Only allow SSO users from the listed email domains. Enter one domain per line. Duplicated entries are automatically removed."
              />
              <TextArea
                id="protection.sso_enforcement.allowed_domains"
                v-model="allowedDomainsText"
                class="w-full min-h-[2.75rem]"
                rows="6"
                cols="30"
                placeholder="example.com&#10;acme.org"
                :disabled="props.disabledFields"
                data-testid="environment-form__protection__sso-enforcement-domains-field"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
