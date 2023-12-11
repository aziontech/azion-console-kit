<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Your Settings"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :createService="props.createRealTimePurgeService"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsSettings
            :loadAccountDetailsService="loadAccountDetailsService"
            :listTimezonesService="listTimezonesService"
            :listCountriesPhoneService="listCountriesPhoneService"
            :listTeamsService="listTeamsService"
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

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsSettings from './FormFields/FormFieldsSettings'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'

  const props = defineProps({
    loadAccountDetailsService: {
      type: Function,
      required: true
    },
    createUsersService: {
      type: Function,
      required: true
    },
    listTimezonesService: {
      type: Function,
      required: true
    },
    listCountriesPhoneService: {
      type: Function,
      required: true
    },
    listTeamsService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    firstName: yup.string().required('first name is a required field').max(30),
    lastName: yup.string().required('last name is a required field').max(30),
    selectedTimezone: yup.string().required('timezone is a required field'),
    selectedLanguage: yup.string(),
    email: yup.string().email().required('e-mail is a required field').max(254),
    mobile: yup.string().required('mobile phone is a required field').max(20),
    mfa: yup.boolean()
  })
</script>
