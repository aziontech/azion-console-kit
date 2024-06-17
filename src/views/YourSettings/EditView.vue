<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Your Settings" />
    </template>
    <template #content>
      <EditFormBlock
        :schema="validationSchema"
        :editService="props.editUsersService"
        :loadService="loadUser"
        disableRedirect
        disableAfterCreateToastFeedback
        @on-edit-success="successSubmit"
      >
        <template #form>
          <FormFieldsYourSettings
            :listTimezonesService="listTimezonesService"
            :listCountriesPhoneService="listCountriesPhoneService"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading, values }">
          <ActionBarBlockWithTeleport
            @onSubmit="formSubmit(onSubmit, values)"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref } from 'vue'

  import ContentBlock from '@/templates/content-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'
  import FormFieldsYourSettings from './FormFields/FormFieldsYourSettings.vue'
  import { TOAST_LIFE } from '@/utils/constants'

  const toast = useToast()

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

  const userData = ref({})
  const userChanges = ref({})

  const loadUser = async () => {
    userData.value = await props.loadUserService()

    return userData.value
  }

  const showToast = (severity, detail, summary = severity) => {
    if (!detail) return

    const options = {
      closable: true,
      severity,
      summary,
      detail
    }

    if (severity === 'success') {
      options.life = TOAST_LIFE
    }

    toast.add(options)
  }

  const validateFormChanges = (values) => {
    const keysToCheck = [
      'firstName',
      'lastName',
      'timezone',
      'language',
      'countryCallCode',
      'mobile',
      'email',
      'twoFactorEnabled',
      'password',
      'oldPassword',
      'confirmPassword'
    ]

    const changedKeys = keysToCheck.filter((key) => values[key] !== userData.value[key])
    const isEmailChanged = changedKeys.includes('email')
    const areOtherKeysChanged = changedKeys.some((key) => key !== 'email')
    return { isEmailChanged, areOtherKeysChanged }
  }

  const showEmailToast = () => {
    showToast('info', 'We have sent you a confirmation email.', 'Confirmation email')
  }

  const successSubmit = () => {
    const { isEmailChanged, areOtherKeysChanged } = validateFormChanges(userChanges.value)
    userData.value = { ...userChanges.value }

    if (!isEmailChanged || areOtherKeysChanged) {
      showToast('success', 'Your user has been updated')
    }

    if (isEmailChanged) {
      showEmailToast()
    }
  }

  const formSubmit = async (onSubmit, value) => {
    userChanges.value = value
    onSubmit()
  }

  const passwordRequirementsList = ref([
    { label: '8 characters', valid: false },
    { label: '1 uppercase letter', valid: false },
    { label: '1 lowercase letter', valid: false },
    { label: '1 special character (example: !?<>@#$%)', valid: false }
  ])

  const validationSchema = yup.object({
    firstName: yup.string().required().max(30).label('First Name'),
    lastName: yup.string().required().max(30).label('Last Name'),
    timezone: yup.string(),
    language: yup.string(),
    countryCallCode: yup.string(),
    email: yup.string().email().required().max(254).label('Email'),
    mobile: yup.string().required().label('Phone Number'),
    twoFactorEnabled: yup.boolean(),
    oldPassword: yup.string(),
    password: yup.string().when('oldPassword', {
      is: (val) => !!val, // Set the field as required when oldPassword has a value
      then: () =>
        yup
          .string()
          .required()
          .test('max', 'Exceeded number of characters.', (value) => value?.length <= 128)
          .test('noSpaces', 'Spaces not allowed.', (value) => !value?.match(/\s/g))
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
          .label('Confirm Password')
    })
  })
</script>
