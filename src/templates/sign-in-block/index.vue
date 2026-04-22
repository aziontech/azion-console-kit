<template>
  <form
    class="h-full w-full"
    @submit.prevent
  >
    <div class="h-full flex flex-col justify-center items-center">
      <div class="flex flex-col align-top items-center animate-fadeIn w-full max-w-[448px] h-full">
        <div
          class="surface-card surface-border border max-w-md w-full p-6 sm:p-8 rounded-md flex-col gap-6 sm:gap-8 flex"
        >
          <!-- Header -->
          <div class="flex flex-col gap-2">
            <h1
              data-testid="title"
              class="text-xl md:text-2xl font-medium text-left"
            >
              Welcome Back
            </h1>
            <p class="text-sm text-color-secondary">Sign in to your account.</p>
          </div>

          <!-- Email step -->
          <div
            v-if="!showPassword"
            class="flex flex-col sm:gap-8 gap-6"
          >
            <div class="flex flex-col gap-6">
              <!-- Email field -->
              <div class="flex flex-col gap-2">
                <label
                  for="email"
                  class="font-semibold text-sm"
                  :class="classEmailError"
                >
                  Email
                </label>
                <InputText
                  data-sentry-mask
                  v-model="email"
                  id="email"
                  placeholder="example@email.com"
                  type="email"
                  @vue:mounted="({ el }) => autofocusInput(el)"
                  @keydown.enter="checkLoginMethod"
                  class="w-full"
                  :class="classEmailError"
                  data-testid="signin-block__email-input"
                />
                <small
                  class="p-error text-xs font-normal leading-tight"
                  v-if="errors.email"
                  severity="error"
                >
                  {{ errors.email }}
                </small>
              </div>

              <!-- Next button -->
              <PrimeButton
                class="w-full flex-row-reverse"
                type="button"
                label="Next"
                data-testid="signin-block__next-button"
                :loading="isProccedButtonLoading"
                :disabled="!email"
                @click="checkLoginMethod"
              />
            </div>

            <!-- Social IDPs section -->
            <div
              v-if="showSocialIdps"
              class="flex-col gap-6 sm:gap-8 flex"
            >
              <Divider align="center">
                <p>or</p>
              </Divider>
            </div>

            <SocialIdpsBlock
              v-model:showSocialIdps="showSocialIdps"
              context="login"
            />
          </div>

          <!-- Password step -->
          <div
            v-else
            class="flex flex-col sm:gap-8 gap-6"
          >
            <!-- Back button and email display -->
            <div class="flex items-center gap-2">
              <PrimeButton
                v-tooltip.top="{ value: 'Back', showDelay: 200 }"
                class="w-7 h-7"
                outlined
                icon="pi pi-chevron-left"
                @click="resetPasswordStep"
              />
              <p class="text-sm">{{ email }}</p>
            </div>
            <div class="flex flex-col gap-6">
              <!-- Password field -->
              <div class="flex flex-col gap-2">
                <FieldPassword
                  ref="passwordFieldRef"
                  name="password"
                  label="Password"
                  :disabled="isButtonLoading"
                  :additionalError="hasRequestErrorMessage || ''"
                  data-testid="signin-block__password-input"
                  @submit="validateAndSubmit"
                  @vue:mounted="focusPasswordField"
                />

                <!-- Forgot password link -->
                <div>
                  <PrimeButton
                    link
                    class="p-0 text-sm"
                    label="Forgot Password?"
                    @click="$emit('goToForgotPassword', true)"
                  />
                </div>
              </div>

              <!-- Sign In button -->
              <PrimeButton
                class="w-full flex-row-reverse"
                :loading="isButtonLoading"
                label="Sign In"
                type="button"
                @click="validateAndSubmit"
                :disabled="!password"
                data-testid="signin-block__signin-button"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap justify-center items-center pt-6 gap-1">
        <p class="text-sm">Don't have an account?</p>
        <PrimeButton
          label="Sign Up"
          class="p-0 text-sm"
          link
          @click="goToSignup"
        />
      </div>
    </div>
  </form>
</template>

<script setup>
  import { ProccessRequestError, UnexpectedError, UserNotFoundError } from '@/services/axios/errors'
  import { verifyLoginMethodService } from '@/services/auth-services/get-login-method-service'
  import { validateOAuthRedirect } from '@/helpers/oauth-security'
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import FieldPassword from '@aziontech/webkit/field-password'
  import SocialIdpsBlock from '@/templates/social-idps-block'
  import { useField, useForm } from 'vee-validate'
  import { ref, inject, onMounted, computed, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { loadUserAndAccountInfo } from '@/helpers/account-data'

  import Divider from '@aziontech/webkit/divider'
  import * as yup from 'yup'
  import { useToast } from '@aziontech/webkit/use-toast'
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const accountStore = useAccountStore()

  defineOptions({ name: 'signInBlock' })

  const router = useRouter()

  const showPassword = ref(false)
  const hasRequestErrorMessage = ref(false)
  const isProccedButtonLoading = ref(false)
  const isButtonLoading = ref(false)

  const props = defineProps({
    authenticationLoginService: {
      type: Function,
      required: true
    },
    verifyLoginService: {
      type: Function,
      required: true
    },
    refreshLoginService: {
      type: Function,
      required: true
    },
    accountHandler: {
      type: Object,
      required: true
    }
  })

  const route = useRoute()
  const toast = useToast()

  const classEmailError = computed(() => {
    return errors.value.email ? 'p-invalid p-error' : ''
  })

  const verifyErrorsOnUrl = () => {
    const { error_description: errorMessage } = route.query

    if (errorMessage) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Verification failed',
        detail: errorMessage
      })
    }
  }

  onMounted(() => {
    verifyErrorsOnUrl()
  })

  const showSocialIdps = ref(true)
  const emailValidateRegex = /^\S+@\S+\.\S+$/

  const validationSchema = yup.object({
    email: yup.string().matches(emailValidateRegex, 'Use a valid email to sign in.'),
    password: yup.string().required()
  })

  const { errors, values } = useForm({
    validationSchema,
    initialValues: {
      email: '',
      password: ''
    }
  })

  const { value: email } = useField('email')
  const { value: password, resetField } = useField('password')

  const passwordFieldRef = ref(null)

  const focusPasswordField = () => {
    nextTick(() => {
      const el = passwordFieldRef.value?.$el || passwordFieldRef.value
      if (el) autofocusInput(el)
    })
  }

  const goToSignup = () => {
    router.push({ name: 'signup' })
  }

  const validateAndSubmit = async () => {
    try {
      if (!password.value || isButtonLoading.value) return

      isButtonLoading.value = true
      hasRequestErrorMessage.value = false

      const loginData = {
        email: values.email,
        password: values.password,
        captcha: 'default'
      }

      await props.authenticationLoginService(loginData)
      const { twoFactor, trustedDevice, user_tracking_info: userInfo } = await verify()
      const signupTypeFlags = accountStore.getSignupTypeFlags()

      // Load user and account info to populate accountStore for HubSpot tracking
      await loadUserAndAccountInfo()
      const { userId: consoleUserId, accountData } = accountStore
      tracker.signIn
        .userSignedIn({
          method: 'email',
          signupTypeFlags,
          email: accountData?.email || values.email,
          userId: consoleUserId,
          firstname: accountData?.first_name || accountData?.name?.split(' ')[0],
          lastname: accountData?.last_name || accountData?.name?.split(' ').slice(1).join(' '),
          company: accountData?.company_name
        })
        .track()
      if (twoFactor) {
        const mfaRoute = trustedDevice ? 'authentication' : 'setup'
        router.push(`/mfa/${mfaRoute}`)
        return
      }

      await switchClientAccount(userInfo.props)
    } catch {
      const signupTypeFlags = accountStore.getSignupTypeFlags()
      tracker.signIn.userFailedSignIn({ method: 'email', signupTypeFlags }).track()
      hasRequestErrorMessage.value = new UserNotFoundError().message
      isButtonLoading.value = false
    }
  }

  const verify = async () => {
    try {
      return await props.verifyLoginService()
    } catch {
      await props.refreshLoginService()
    }
  }

  const switchClientAccount = async ({ account_id }) => {
    try {
      const redirect = await props.accountHandler.switchAndReturnAccountPage(account_id)
      router.push(redirect)
    } catch {
      hasRequestErrorMessage.value = new ProccessRequestError().message
      isButtonLoading.value = false
    }
  }

  const checkLoginMethod = async () => {
    if (errors.value.email || !email.value) return
    try {
      const res = await verifyLoginMethodService(email.value)
      if (res.loginMethod === 'federated') {
        const encodedEmail = encodeURIComponent(email.value)
        const redirectUrl = `${res.loginUrl}?email=${encodedEmail}&console=true`

        if (validateOAuthRedirect(redirectUrl)) {
          window.location.replace(redirectUrl)
        } else {
          hasRequestErrorMessage.value = 'Invalid redirect URL detected'
        }
      } else {
        showPasswordStep()
      }
    } catch {
      hasRequestErrorMessage.value = new UnexpectedError().message
    }
  }

  const showPasswordStep = () => {
    isProccedButtonLoading.value = true
    setTimeout(() => {
      isProccedButtonLoading.value = false
      showPassword.value = true
      resetField()
    }, 500)
  }

  const resetPasswordStep = () => {
    hasRequestErrorMessage.value = false
    showPassword.value = false
    resetField()
  }

  const autofocusInput = (inputEl) => {
    const inputElement = inputEl.querySelector('input') || inputEl
    inputElement.focus()
  }
</script>
