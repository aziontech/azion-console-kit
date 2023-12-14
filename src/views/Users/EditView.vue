<script setup>
  import * as yup from 'yup'
  import EditFormBlock from '@/templates/edit-form-block'
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
    },
    editUserService: {
      type: Function,
      required: true
    },
    loadUserService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    firstName: yup.string().required('first name is a required field').max(30),
    lastName: yup.string().required('last name is a required field').max(30),
    timezone: yup.string().required('timezone is a required field'),
    language: yup.string(),
    email: yup.string().email().required('e-mail is a required field').max(254),
    countryCallCode: yup.object().required('country is a required field'),
    mobile: yup.string().required('mobile phone is a required field').max(20),
    userIsOwner: yup.boolean(),
    teamsIds: yup.array(),
    twoFactorEnabled: yup.boolean()
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit User"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editUserService"
        :loadService="props.loadUserService"
        :updatedRedirect="props.updatedRedirect"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsUsers
            :loadAccountDetailsService="loadAccountDetailsService"
            :listTimezonesService="listTimezonesService"
            :listCountriesPhoneService="listCountriesPhoneService"
            :listTeamsService="listTeamsService"
            :isEditForm="true"
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
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
