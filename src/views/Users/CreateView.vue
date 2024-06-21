<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create User"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createUsersService"
        :schema="validationSchema"
      >
        <template #form="{ resetForm }">
          <FormFieldsUsers
            :resetForm="resetForm"
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
    firstName: yup.string().required('First Name is a required field.').max(30),
    lastName: yup.string().required('Last Name is a required field.').max(30),
    timezone: yup.string().required('Timezone is a required field.'),
    language: yup.string(),
    email: yup.string().email().required('Email is a required field.').max(254),
    countryCallCode: yup.string().required('Country is a required field.'),
    mobile: yup.string().required('Phone Number is a required field.').max(20),
    isAccountOwner: yup.boolean(),
    teamsIds: yup
      .array()
      .min(1, 'Must select at least one team')
      .when('isAccountOwner', {
        is: true,
        then: () => yup.array()
      }),
    twoFactorEnabled: yup.boolean()
  })
</script>
