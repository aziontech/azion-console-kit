<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Identity Provider"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editService"
        :loadService="loadService"
        :schema="validationSchema"
        :updatedRedirect="props.updatedRedirect"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
      >
        <template #form>
          <FormFieldsCreateIdentityProvider :isEditForm="true" />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading, values }">
          <ActionBarBlockWithTeleport
            v-if="!values.managed"
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsCreateIdentityProvider from './FormFields/FormFieldsCreateIdentityProvider.vue'
  import * as yup from 'yup'
  import { useRoute } from 'vue-router'
  import { inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    editOIDCIdentityProviderService: {
      type: Function,
      required: true
    },
    editSAMLIdentityProviderService: {
      type: Function,
      required: true
    },
    loadOIDCIdentityProviderService: {
      type: String,
      required: true
    },
    loadSAMLIdentityProviderService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const idpTypes = {
    OPEN_ID: 'OIDC',
    SAML: 'SAML'
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
    certificate: yup.string()
  })

  const route = useRoute()
  const protocol = route.params.protocol

  const editService =
    protocol === 'OIDC'
      ? props.editOIDCIdentityProviderService
      : props.editSAMLIdentityProviderService

  const loadService =
    protocol === 'OIDC'
      ? props.loadOIDCIdentityProviderService
      : props.loadSAMLIdentityProviderService

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'SSO Management'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'SSO Management',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>
