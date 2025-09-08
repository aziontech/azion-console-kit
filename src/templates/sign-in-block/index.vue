<template>
  <form
    class="max-sm:min-h-[calc(100vh-120px)]"
    @submit.prevent
  >
    <!-- Main container -->
    <div class="flex flex-col align-top items-center animate-fadeIn">
      <div
        class="surface-card surface-border border max-w-md w-full p-6 sm:p-8 rounded-md flex-col gap-6 sm:gap-8 flex"
      >
        <!-- Header -->
        <h3
          data-testid="title"
          class="text-xl md:text-2xl font-medium text-left"
        >
          Azion Console
        </h3>

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

          <SocialIdpsBlock v-model:showSocialIdps="showSocialIdps" />
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
              <label
                for="password"
                class="font-semibold text-sm"
                :class="classPasswordError"
              >
                Password
              </label>
              <Password
                toggleMask
                v-model="password"
                id="password"
                @vue:mounted="({ el }) => autofocusInput(el)"
                class="w-full"
                :class="classPasswordError"
                @keydown.enter="validateAndSubmit"
                :feedback="false"
                data-testid="signin-block__password-input"
              />
              <small
                class="p-error text-xs font-normal leading-tight"
                v-if="hasRequestErrorMessage"
              >
                {{ hasRequestErrorMessage }}
              </small>
            </div>

            <!-- Forgot password link -->
            <div>
              <PrimeButton
                link
                class="p-0"
                label="Forgot Password?"
                @click="$emit('goToForgotPassword', true)"
              />
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

    <!-- Create account button -->
    <div class="flex flex-wrap justify-center items-center pt-6 gap-1">
      <div>Don't have an account?</div>
      <PrimeButton
        label="Sign Up"
        class="p-0"
        link
        @click="goToSignup"
      />
    </div>
  </form>
</template>

<script setup>
  import { ProccessRequestError, UnexpectedError, UserNotFoundError } from '@/services/axios/errors'
  import { verifyLoginMethodService } from '@/services/auth-services/get-login-method-service'
  import { validateOAuthRedirect } from '@/helpers/oauth-security'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import Password from 'primevue/password'
  import SocialIdpsBlock from '@/templates/social-idps-block'
  import { useField, useForm } from 'vee-validate'
  import { ref, inject, onMounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import Divider from 'primevue/divider'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

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

  const classPasswordError = computed(() => {
    return hasRequestErrorMessage.value ? 'p-invalid' : ''
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
      tracker.signIn.userSignedIn()
      if (twoFactor) {
        const mfaRoute = trustedDevice ? 'authentication' : 'setup'
        router.push(`/mfa/${mfaRoute}`)
        return
      }

      await switchClientAccount(userInfo.props)
    } catch {
      tracker.signIn.userFailedSignIn().track()
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
