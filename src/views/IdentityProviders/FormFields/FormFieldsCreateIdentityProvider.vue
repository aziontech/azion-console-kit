<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import MultiSelect from 'primevue/multiselect'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Password from 'primevue/password'
  import { useField } from 'vee-validate'

  const { value: name } = useField('name')
  const { value: identityProviderType } = useField('identityProviderType', null, {
    initialValue: 'openid'
  })
  const { value: authorizationUrl } = useField('authorizationUrl')
  const { value: userInfoUrl } = useField('userInfoUrl')
  const { value: tokenUrl } = useField('tokenUrl')
  const { value: clientId } = useField('clientId')
  const { value: clientSecret, errorMessage: clientSecretErrorMessage } = useField('clientSecret')
  const { value: scopes, errorMessage: scopesErrorMessage } = useField('scopes')
  const { value: responseMode } = useField('responseMode', null, {
    initialValue: 'Query'
  })

  const scopesOptions = [
    { value: 'openid', label: 'Open ID' },
    { value: 'profile', label: 'Profile' },
    { value: 'email', label: 'Email' }
  ]
  const identityProviderRadioOptions = [
    {
      title: 'Open ID Provider Configuration',
      subtitle: `Configure the Federated Authentication to enable users access to Real-Time Manager with partner's accounts.`,
      inputValue: 'openid'
    },
    {
      title: 'SAML Configuration',
      subtitle: `Configure the Federated Authentication to enable users access to Real-Time Manager with partner's accounts.`,
      inputValue: 'saml'
    }
  ]
</script>

<template>
  <FormHorizontal
    title="General"
    description="Configure the Federated Authentication to enable users access to Real-Time Manager with partner's accounts."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="Identity Provider Name"
          :value="name"
          description="Give a unique and descriptive name to identify the provider."
          data-testid="network-list-form__name"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Select the Identity Provider"
    description="Choose between Open ID connect or SAML provider."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3">
        <FieldGroupRadio
          nameField="identityProviderType"
          :isCard="true"
          :options="identityProviderRadioOptions"
          data-testid="sso-management-create-form__identity-provider-type"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    v-if="identityProviderType === 'openid'"
    title="Open ID Provider Configuration"
    description="Configure the Federated Authentication."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="sso-management-form__subject-name"
          label="Authorization URL"
          required
          placeholder="https://authorizationURL.com/authorize"
          description="The authorization endpoint URL of your IdP."
          :value="authorizationUrl"
          name="authorizationUrl"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="sso-management-form__userinfo-url"
          label="UserInfo URL"
          required
          placeholder="https://UserinfoURL.com/userinfo"
          description="The endpoint that returns a user's profile."
          :value="userInfoUrl"
          name="userInfoUrl"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="sso-management-form__token-url"
          label="Token URL"
          required
          placeholder="https://TokenURL.com/token"
          description="The token endpoint URL of your IdP."
          :value="tokenUrl"
          name="tokenUrl"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="sso-management-form__client-id"
          label="Client ID"
          required
          placeholder="0a00000a-000b-00a0-b000-a0000a000000"
          :value="clientId"
          name="clientId"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="clientSecret"
          class="font-semibold text-sm"
          :class="{ 'p-error': clientSecretErrorMessage }"
        >
          Client Secret
        </label>
        <Password
          toggleMask
          autocomplete="off"
          v-model="clientSecret"
          id="clientSecret"
          class="w-full"
          :class="{ 'p-invalid': clientSecretErrorMessage }"
          :feedback="false"
          data-testid="sso-management-form__client-secret"
        />
        <small
          class="p-error text-xs font-normal leading-tight"
          v-if="clientSecretErrorMessage"
        >
          {{ clientSecretErrorMessage }}
        </small>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <LabelBlock
          for="select-01"
          label="Scopes"
          isRequired
        />
        <MultiSelect
          id="scopesList"
          v-model="scopes"
          :options="scopesOptions"
          filter
          name="scopes"
          autoFilterFocus
          optionLabel="label"
          optionValue="value"
          placeholder="Select scopes"
          :class="{ 'p-invalid': scopesErrorMessage }"
          class="w-full"
          display="chip"
          data-testid="sso-management-form__scopes__multiselect"
        />
        <small
          v-if="scopesErrorMessage"
          class="p-error text-xs font-normal leading-tight"
          >{{ scopesErrorMessage }}
        </small>
        <small class="text-xs text-color-secondary font-normal leading-5">
          Scopes are used by an application during authentication to authorize access to a user's
          details.
        </small>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          readonly
          disabled
          data-testid="sso-management-form__response-mode"
          label="Response Mode"
          :value="responseMode"
          name="responseMode"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    v-if="identityProviderType === 'saml'"
    title="SAML Configuration"
    description="Configure the Federated Authentication."
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-3">saml</div>
    </template>
  </FormHorizontal>
</template>
