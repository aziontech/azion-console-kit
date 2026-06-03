<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Your Settings"
        description="Define and manage personal account preferences and profile configuration."
      />
    </template>
    <template #content>
      <EditFormBlock
        :schema="validationSchema"
        :editService="props.editUsersService"
        :loadService="loadUser"
        disableRedirect
        disableAfterCreateToastFeedback
        @on-edit-fail="handleTrackFailEdit"
        @on-edit-success="successSubmit"
        @loaded-service-object="isFormLoading = false"
      >
        <template #form="{ loading }">
          <FormSkeleton v-if="loading || isFormLoading" />
          <FormFieldsYourSettings
            v-show="!loading && !isFormLoading"
            :timezoneOptions="optionsTimezone"
            :listCountriesPhoneService="listCountriesPhoneService"
            @password-strength="onPasswordStrengthChange"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading, values }">
          <ActionBarBlockWithTeleport
            v-if="!isFormLoading"
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
  import { ref, inject } from 'vue'

  import ContentBlock from '@/templates/content-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { useToast } from '@aziontech/webkit/use-toast'
  import * as yup from 'yup'
  import FormFieldsYourSettings from './FormFields/FormFieldsYourSettings.vue'
  import FormSkeleton from './components/FormSkeleton.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const toast = useToast()

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Your Settings'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Your Settings',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

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

  const isFormLoading = ref(true)
  const userData = ref({})
  const userChanges = ref({})
  const optionsTimezone = ref([])

  const loadUser = async () => {
    const [user, timezones] = await Promise.all([
      props.loadUserService(),
      props.listTimezonesService()
    ])

    optionsTimezone.value = timezones.listTimeZones
    userData.value = user

    return user
  }

  const showToast = (severity, detail, summary = severity) => {
    if (!detail) return

    const options = {
      closable: true,
      severity,
      summary,
      detail
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
    showToast(
      'info',
      'Check your inbox and follow the instructions to verify this new email.',
      'Confirmation email sent'
    )
  }

  const successSubmit = () => {
    handleTrackSuccessEdit()
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

  const passwordStrength = ref(null)

  const onPasswordStrengthChange = (strength) => {
    passwordStrength.value = strength
  }

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
      is: (val) => !!val,
      then: () =>
        yup
          .string()
          .required()
          .test('max', 'Exceeded number of characters.', (value) => value?.length <= 128)
          .test('noSpaces', 'Spaces not allowed.', (value) => !value?.match(/\s/g))
          .test('requirements', 'Password does not meet the requirements.', () => {
            return passwordStrength.value?.level === 'strong'
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
