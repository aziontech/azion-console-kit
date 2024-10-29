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
          :disabled="isEditForm"
          nameField="identityProviderType"
          :isCard="true"
          :options="identityProviderRadioOptions"
          data-testid="sso-management-create-form__identity-provider-type"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    v-if="identityProviderType === 'OIDC'"
    title="Open ID Provider Configuration"
    description="Configure the Federated Authentication."
  >
    <template #inputs>
      <template v-if="isEditForm">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            readonly
            disabled
            data-testid="sso-management-form__login-url"
            label="Login URL"
            description="This URL contains the login page of the Azion RTM application that will perform single sign-on initiated
              by the service provider. However, that is not needed if you want to perform identity provider-initiated single sign-on."
            :value="loginUrl"
            name="loginUrl"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            readonly
            disabled
            data-testid="sso-management-form__redirect-url"
            label="Redirect URL"
            description="This is the URL to which your IdP will response to the request after authenticating a user."
            :value="redirectUrl"
            name="redirectUrl"
          />
        </div>
      </template>
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
        <LabelBlock
          for="scopes"
          data-testid="sso-management-form__client-secret-label"
          label="Client Secret"
          isRequired="true"
        />
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
          for="scopes"
          data-testid="sso-management-form__scopes__multiselect-label"
          label="Scopes"
          isRequired="true"
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
    v-if="identityProviderType === 'SAML'"
    title="SAML Configuration"
    description="Configure the Federated Authentication."
  >
    <template #inputs>
      <template v-if="isEditForm">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            readonly
            disabled
            data-testid="sso-management-form__login-url"
            label="Login URL"
            description="This URL contains the login page of the Azion RTM application that will perform single sign-on initiated
           by the service provider. However, that is not needed if you want to perform identity provider-initiated single sign-on."
            :value="loginUrl"
            name="loginUrl"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            readonly
            disabled
            data-testid="sso-management-form__assertion-consumer-service-url"
            label="Assertion Consumer Service URL"
            description="This is the URL to which your IdP will send Authentication Assertions after authenticating a user.
           Enter this value where the IdP asks for Assertion Consumer Service URL."
            :value="acsUrl"
            name="acsUrl"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            readonly
            disabled
            data-testid="sso-management-form__service-providers-entity-id-url"
            label="Service Provider's Entity ID URI"
            description="The Entity ID (sometimes referred to as the Issuer) names the Azion RTM within your IdP.
           Use this value if the Identity Provider asks for Entity ID or SAML Audience."
            :value="metadataUrl"
            name="metadataUrl"
          />
        </div>
      </template>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="sso-management-form__idp-entity-id-url"
          label="Identity provider's Entity ID URI"
          required
          placeholder="https://authorizationURL.com/authorize"
          description="A unique URL that identifies your identity
           provider as the recipient of SAML requests that Azion sends. This entity ID must be the same as the <saml:Issuer> attribute in the SAML assertion."
          :value="entityIdUrl"
          name="entityIdUrl"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          data-testid="sso-management-form__idp-sign-in-url"
          label="Sign-in URL"
          required
          placeholder="https://tokenURL.com/authorize"
          description="The URL where Azion sends a SAML request to start the
           login sequence."
          :value="signInUrl"
          name="signInUrl"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          :required="!isEditForm"
          data-testid="sso-management-form__certificate-field"
          label="X-509 Certificate"
          placeholder="-----BEGIN CERTIFICATE-----&#10;-----END CERTIFICATE-----"
          name="certificate"
          :value="certificate"
          description="The authentication certificate issued by your identity provider."
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import MultiSelect from 'primevue/multiselect'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import Password from 'primevue/password'
  import { useField } from 'vee-validate'
  import { watch } from 'vue'
  import LabelBlock from '@/templates/label-block'

  const emit = defineEmits(['update:idpTypeSelection'])
  defineOptions({ name: 'identity-providers-create' })

  const props = defineProps({
    isEditForm: {
      type: Boolean,
      default: false
    }
  })

  const { value: name } = useField('name')

  // OIDP fields
  const { value: identityProviderType } = useField('identityProviderType')

  const { value: authorizationUrl } = useField('authorizationUrl')
  const { value: userInfoUrl } = useField('userInfoUrl')
  const { value: tokenUrl } = useField('tokenUrl')
  const { value: clientId } = useField('clientId')
  const { value: clientSecret, errorMessage: clientSecretErrorMessage } = useField('clientSecret')
  const { value: scopes, errorMessage: scopesErrorMessage } = useField('scopes')
  const { value: responseMode } = useField('responseMode', null, {
    initialValue: 'Query'
  })

  // SAML fields
  const { value: entityIdUrl } = useField('entityIdUrl')
  const { value: signInUrl } = useField('signInUrl')
  const { value: certificate } = useField('certificate')

  // Edit Fields
  const { value: loginUrl } = useField('loginUrl')
  const { value: acsUrl } = useField('acsUrl')
  const { value: metadataUrl } = useField('metadataUrl')
  const { value: redirectUrl } = useField('redirectUrl')

  const scopesOptions = [
    { value: 'openid', label: 'Open ID' },
    { value: 'profile', label: 'Profile' },
    { value: 'email', label: 'Email' }
  ]
  const identityProviderRadioOptions = [
    {
      title: 'Open ID Provider Configuration',
      subtitle: `Configure the Federated Authentication to enable users access to Real-Time Manager with partner's accounts.`,
      inputValue: 'OIDC'
    },
    {
      title: 'SAML Configuration',
      subtitle: `Configure the Federated Authentication to enable users access to Real-Time Manager with partner's accounts.`,
      inputValue: 'SAML'
    }
  ]

  if (!props.isEditForm) {
    identityProviderType.value = 'OIDC'
  }

  watch(identityProviderType, () => {
    emit('update:identityProviderSelection', identityProviderType.value)
  })
</script>
