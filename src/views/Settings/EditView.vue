<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Your Settings"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editUsersService"
        :schema="validationSchema"
        :loadService="loadUser"
        :disableRedirect="true"
      >
        <template #form>
          <FormFieldsSettings
            :listTimezonesService="listTimezonesService"
            :listCountriesPhoneService="listCountriesPhoneService"
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
  import { useAccountStore } from '@/stores/account'

  const props = defineProps({
    loadUserService: {
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
    editUsersService: {
      type: Function,
      required: true
    }
  })

  async function loadUser() {
    const { account } = useAccountStore()
    const id = account.user_id
    return await props.loadUserService({ id })
  }

  const validationSchema = yup.object({
    firstName: yup.string().required('first name is a required field').max(30),
    lastName: yup.string().required('last name is a required field').max(30),
    timezone: yup.string(),
    language: yup.string(),
    countryCallCode: yup.string(),
    email: yup.string().email().required('e-mail is a required field').max(254),
    mobile: yup.string(),
    twoFactorEnabled: yup.boolean(),
    oldPassword: yup.string(),
    password: yup.string().when('oldPassword', {
      is: (val) => !!val, // Set the field as required when oldPassword has a value
      then: () => yup.string().required('Password is required')
    }),
    confirmPassword: yup.string().when('password', {
      is: (val) => !!val,
      then: () =>
        yup
          .string()
          .required('Confirm password is required')
          .oneOf([yup.ref('password'), null], 'Passwords must match')
    })
  })
</script>
