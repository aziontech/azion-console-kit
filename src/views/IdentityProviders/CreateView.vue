<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Identity Provider"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        ref="createFormBlockRef"
        :createService="createServiceBySelectedType"
        @on-response="handleTrackCreation"
        @on-response-fail="handleTrackFailedCreation"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsCreateIdentityProvider
            v-model:identity-provider-selection="idpTypeSelection"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
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
  import CreateFormBlock from '@/templates/create-form-block'
  import FormFieldsCreateIdentityProvider from './FormFields/FormFieldsCreateIdentityProvider'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import * as yup from 'yup'
  import { inject, ref, watch } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const props = defineProps({
    createOIDCIdentityProviderService: Function,
    createSAMLIdentityProviderService: Function
  })

  const idpTypes = {
    OPEN_ID: 'OIDC',
    SAML: 'SAML'
  }
  const idpTypeSelection = ref(idpTypes.OPEN_ID)

  const initialValues = {
    // OPEN ID Fields
    name: '',
    identityProviderType: idpTypes.OPEN_ID,
    authorizationUrl: '',
    userInfoUrl: '',
    tokenUrl: '',
    clientId: '',
    clientSecret: '',
    scopes: [],
    responseMode: 'query',

    // SAML Fields
    entityIdUrl: '',
    signInUrl: '',
    certificate: ''
  }

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),

    // OPEN ID Fields
    authorizationUrl: yup.string().when('identityProviderType', {
      is: idpTypes.OPEN_ID,
      then: (schema) =>
        schema.required('Authorization URL is a required field').url('Enter a valid URL')
    }),
    userInfoUrl: yup.string().when('identityProviderType', {
      is: idpTypes.OPEN_ID,
      then: (schema) =>
        schema.required('User Info URL is a required field').url('Enter a valid URL')
    }),
    tokenUrl: yup.string().when('identityProviderType', {
      is: idpTypes.OPEN_ID,
      then: (schema) => schema.required('Token URL is a required field').url('Enter a valid URL')
    }),
    clientId: yup.string().when('identityProviderType', {
      is: idpTypes.OPEN_ID,
      then: (schema) => schema.required('Client ID is a required field')
    }),
    clientSecret: yup.string().when('identityProviderType', {
      is: idpTypes.OPEN_ID,
      then: (schema) => schema.required('Client Secret is a required field')
    }),
    scopes: yup
      .array()
      .of(yup.string())
      .when('identityProviderType', {
        is: idpTypes.OPEN_ID,
        then: (schema) =>
          schema.min(1, 'At least one scope is required').required('Scopes is a required field')
      }),

    // SAML Fields
    entityIdUrl: yup.string().when('identityProviderType', {
      is: idpTypes.SAML,
      then: (schema) =>
        schema.required('Entity ID URL is a required field').url('Enter a valid URL')
    }),
    signInUrl: yup.string().when('identityProviderType', {
      is: idpTypes.SAML,
      then: (schema) => schema.required('Sign In URL is a required field').url('Enter a valid URL')
    }),
    certificate: yup.string().when('identityProviderType', {
      is: idpTypes.SAML,
      then: (schema) => schema.required('Certificate is a required field')
    })
  })

  const handleTrackCreation = () => {
    tracker.product.productCreated({
      productName: 'SSO Management'
    })
  }

  const handleTrackFailedCreation = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'SSO Management',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
  const createFormBlockRef = ref(null)

  const createOIDCIdentityProviderServiceHandle = props.createOIDCIdentityProviderService
  const createSAMLIdentityProviderServiceHandle = props.createSAMLIdentityProviderService

  const createServiceBySelectedType = ref(props.createOIDCIdentityProviderService)

  watch(idpTypeSelection, (newType) => {
    const isOpenIdSelected = idpTypeSelection.value === idpTypes.OPEN_ID

    createFormBlockRef.value.resetForm({
      values: { ...createFormBlockRef.value.values, identityProviderType: newType }
    })

    createServiceBySelectedType.value = isOpenIdSelected
      ? createOIDCIdentityProviderServiceHandle
      : createSAMLIdentityProviderServiceHandle
  })
</script>
