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
          <FormFieldsYourSettings
            :listTimezonesService="listTimezonesService"
            :listCountriesPhoneService="listCountriesPhoneService"
          />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading, values, setValues }">
          <ActionBarBlockWithTeleport
            @onSubmit="formSubmit(onSubmit, values, setValues)"
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
  import { ref } from 'vue'

  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsYourSettings from './FormFields/FormFieldsYourSettings.vue'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'
  import { useAccountStore } from '@/stores/account'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()


  const currentEmail = ref('')

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

  const loadUser = async () => {
    const { account } = useAccountStore()
    const id = account.user_id
    const userData = await props.loadUserService({ id })

    currentEmail.value = userData.email

    return userData
  }
  const formSubmit = (onSubmit, values, setValues) => {
    onSubmit()
    if(values.email !== currentEmail.value) {
      const toastConfig = {
        closable: true,
        severity: 'warn',
        summary: 'Confirmation email',
        detail: 'A confirmation email message has been sent to your email address.'
      }
      toast.add({ ...toastConfig })
      
      setValues({
        email: currentEmail.value
      })
    }
  }
  const passwordRequirementsList = ref([
    { label: '> 7 characters', valid: false },
    { label: 'Uppercase letter', valid: false },
    { label: 'Lowercase letter', valid: false },
    { label: 'Special character (e.g. !?<>@#$%)', valid: false }
  ])

  const validationSchema = yup.object({
    firstName: yup.string().required().max(30).label('First name'),
    lastName: yup.string().required().max(30).label('Last name'),
    timezone: yup.string(),
    language: yup.string(),
    countryCallCode: yup.string(),
    email: yup.string().email().required().max(254).label('E-mail'),
    mobile: yup.string().required().label('Mobile'),
    twoFactorEnabled: yup.boolean(),
    oldPassword: yup.string(),
    password: yup.string().when('oldPassword', {
      is: (val) => !!val, // Set the field as required when oldPassword has a value
      then: () =>
        yup
          .string()
          .required()
          .test('max', 'Exceeded number of characters', (value) => value?.length <= 128)
          .test('noSpaces', 'Spaces are not allowed', (value) => !value?.match(/\s/g))
          .test('requirements', '', (value) => {
            const hasUpperCase = value && /[A-Z]/.test(value)
            const hasLowerCase = value && /[a-z]/.test(value)
            const hasSpecialChar = value && /[!@#$%^&*(),.?":{}|<>]/.test(value)
            const hasMinLength = value?.length > 7
            passwordRequirementsList.value[0].valid = hasMinLength
            passwordRequirementsList.value[1].valid = hasUpperCase
            passwordRequirementsList.value[2].valid = hasLowerCase
            passwordRequirementsList.value[3].valid = hasSpecialChar
            return hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar
          })
          .label('Password')
    }),
    confirmPassword: yup.string().when('password', {
      is: (val) => !!val,
      then: () =>
        yup
          .string()
          .required()
          .oneOf([yup.ref('password'), null], 'Passwords must match')
          .label('Confirm password')
    })
  })
</script>
