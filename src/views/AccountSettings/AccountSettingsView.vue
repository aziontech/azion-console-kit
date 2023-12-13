<script setup>
  import * as yup from 'yup'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsAccountSettings from './FormFields/FormFieldsAccountSettings'

  defineProps({
    getAccountSettingsService: {
      type: Function,
      required: true
    },
    listCountriesService: {
      type: Function,
      required: true
    },
    listRegionsService: {
      type: Function,
      required: true
    },
    listCitiesService: {
      type: Function,
      required: true
    },
    updateAccountSettingsService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    accountName: yup.string().required('Account name is a required field.'),
    clientId: yup.string(),
    companyName: yup.string(),
    uniqueIdentifier: yup.string(),
    billingEmails: yup.string(),
    postalCode: yup.string().required('Postal code is a required field.'),
    country: yup.string().required('Country is a required field.'),
    region: yup.string().required('State/Region is a required field.'),
    city: yup.string().required('City is a required field.'),
    address: yup.string().required('Address is a required field.'),
    complement: yup.string(),
    isSocialLoginEnabled: yup.boolean(),
    isEnabledMfaToAllUsers: yup.boolean()
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Account Settings" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="updateAccountSettingsService"
        :loadService="getAccountSettingsService"
        updatedRedirect="account-settings"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsAccountSettings
            :listCountriesService="listCountriesService"
            :listRegionsService="listRegionsService"
            :listCitiesService="listCitiesService"
          />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
