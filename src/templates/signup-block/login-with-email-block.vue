<template>
  <div
    class="flex flex-col gap-6 animate-slideDown overflow-hidden"
    v-if="showForm"
  >
    <div class="flex flex-col gap-2">
      <label
        for="email"
        class="font-semibold text-sm"
      >
        Work Email
      </label>
      <InputText
        v-model="email"
        autocomplete="off"
        id="email"
        type="email"
        class="w-full"
        :class="{ 'p-invalid': errors.email }"
        data-sentry-mask
      />
      <small
        v-if="errors.email"
        class="p-error text-xs font-normal leading-tight"
        >{{ errors.email }}</small
      >
    </div>

    <FieldPassword
      name="password"
      label="Password"
      showStrength
      :strongRegex="strongPasswordRegex"
      :requirements="passwordRequirementsList"
      :additionalError="errors.password"
      required
      @strength="onStrengthChange"
    />
  </div>

  <Button
    size="large"
    :label="labelButton"
    :loading="loading"
    @click="eventButtonSignUp"
    class="animate-fadeIn"
  />
</template>

<script setup>
  import Button from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import FieldPassword from '@aziontech/webkit/field-password'

  import { useToast } from '@aziontech/webkit/use-toast'
  import { getInstance, load } from 'recaptcha-v3'
  import { useField, useForm } from 'vee-validate'
  import { useAccountStore } from '@/stores/account'

  import { inject, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import * as yup from 'yup'
  /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const emit = defineEmits(['loginWithEmail'])

  const props = defineProps({
    signupService: { required: true, type: Function },
    showLoginFromEmail: { required: true, type: Boolean }
  })

  let recaptcha

  onMounted(async () => {
    recaptcha = await load(import.meta.env.VITE_RECAPTCHA_SITE_KEY)
    getInstance().showBadge()
  })

  /*
  Enforce the following rules:
    1. Must have at least 1 special character - (?=.*[-_!@#$%^&*(),.?":{}|<>])
    2. Must have at least 1 uppercase letter - (?=.*[A-Z])
    3. Must have at least 1 lowercase letter - (?=.*[a-z])
    4. Must have at least 1 number - (?=.*[0-9])
    5. Must have at least 8 characters - (?=.{8,})
  */
  const strongPasswordRegex =
    '^(?=.*[-_!@#$%^&*(),.?":{}|<>])(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.{8,})'

  const passwordRequirementsList = [
    { text: '8 characters' },
    { text: '1 uppercase letter' },
    { text: '1 lowercase letter' },
    { text: '1 number' },
    { text: '1 special character (example: !?<>@#$%)' }
  ]

  const passwordStrength = ref(null)

  const onStrengthChange = (strength) => {
    passwordStrength.value = strength
  }

  const validationSchema = yup.object({
    email: yup
      .string()
      .max(254, 'Exceeded number of characters.')
      .email('Enter a valid email.')
      .required('Email is a required field.'),
    password: yup
      .string()
      .required('Password is a required field.')
      .test('max', 'Exceeded number of characters.', (value) => value?.length <= 128)
      .test('noSpaces', 'Spaces not allowed.', (value) => !value?.match(/\s/g))
      .test('requirements', 'Password does not meet requirements.', () => {
        return passwordStrength.value?.level === 'strong'
      })
  })

  const { errors, handleSubmit } = useForm({ validationSchema })

  const { value: email } = useField('email')

  const toast = useToast()
  const router = useRouter()
  const loading = ref(false)
  const showForm = ref(false)

  const labelButton = ref('Sign Up with Work Email')

  const encodeEmail = (email) => {
    return encodeURIComponent(email)
  }

  const eventButtonSignUp = () => {
    if (showForm.value) {
      signUp()
    } else {
      handleSignUpEmailClick()
    }
  }

  /**
   * Extracts the name from the given email.
   *
   * @param {string} email - the email from which to extract the name
   * @return {string} the name extracted from the email
   */
  const extractNameFromEmail = (email) => {
    const [emailBeforeAt] = email.split('@')
    const cleanedName = emailBeforeAt.replace(/[^a-zA-Z]/g, ' ').trim()

    return cleanedName
  }

  const getSignupErrorFeedback = (error) => {
    const fallbackMessage = 'Unable to complete sign up. Please try again.'

    if (typeof error === 'string') {
      try {
        const parsedError = JSON.parse(error)
        return {
          message: parsedError?.message || fallbackMessage,
          fieldName: parsedError?.fieldName || ''
        }
      } catch {
        return { message: error || fallbackMessage, fieldName: '' }
      }
    }

    return {
      message: error?.message || fallbackMessage,
      fieldName: ''
    }
  }

  const trackFailedSignUp = ({ fieldName, message }) => {
    try {
      tracker.signUp
        .userFailedSignUp({
          errorType: 'api',
          fieldName,
          errorMessage: message
        })
        .track()
    } catch {
      // Tracking must not keep the signup button loading.
    }
  }

  const signUp = handleSubmit(async (values) => {
    loading.value = true
    try {
      const name = extractNameFromEmail(values.email)
      if (!recaptcha) {
        throw new Error('reCAPTCHA is not ready. Please try again.')
      }
      const captcha = await recaptcha.execute('signup')
      const formattedEmail = encodeEmail(values.email)

      await props.signupService({ ...values, name, captcha })
      await router.push({ query: { email: formattedEmail } })

      tracker.signUp.userClickedSignedUp({ method: 'email' }).track()
      emit('loginWithEmail')
    } catch (err) {
      const { message, fieldName } = getSignupErrorFeedback(err)
      trackFailedSignUp({ fieldName, message })
      toast.add({ severity: 'error', detail: message, summary: 'Error' })
    } finally {
      loading.value = false
    }
  })

  const handleSignUpEmailClick = () => {
    const accountStore = useAccountStore()
    accountStore.resetSsoSignUpMethod()
    // Set signup_email flag when user chooses email signup
    accountStore.setSignupTypeFlag('login_email')
    accountStore.setSignupTypeFlag('signup_email')
    showForm.value = true
    labelButton.value = 'Sign Up'
  }

  onUnmounted(() => {
    getInstance()?.hideBadge()
  })

  watch(
    () => props.showLoginFromEmail,
    (value) => {
      if (!value) {
        showForm.value = !value
        labelButton.value = 'Sign Up'
      }
    }
  )
</script>
