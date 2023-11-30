<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create User"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createUsersService"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsUsers
            :loadAccountDetailsService="loadAccountDetailsService"
            :listTimezonesService="listTimezonesService"
            :listCountriesPhoneService="listCountriesPhoneService"
            :listTeamsService="listTeamsService"
          ></FormFieldsUsers>
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import * as yup from 'yup'
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsUsers from './FormsFields/FormFieldsUsers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

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
    selectedCountry: yup.object().required('country is a required field'),
    mobile: yup.string().required('mobile phone is a required field').max(20),
    userIsOwner: yup.boolean(),
    selectedTeam: yup.array(),
    mfa: yup.boolean()
  })

  const initialValues = {
    userIsOwner: false,
    mobile: '',
    selectedTeam: [],
    twoFactorEnabled: false,
    selectedLanguage: 'en'
  }
</script>
