<template>
  <form
    class="max-sm:min-h-[calc(100vh-120px)]"
    @submit.prevent
  >
    <!-- Email step -->
    <div
      class="flex flex-col align-top items-center animate-fadeIn"
      v-if="!showPassword"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 sm:p-8 rounded-md flex-col gap-6 sm:gap-8 flex"
      >
        <h3
          data-testid="title"
          class="text-xl md:text-2xl font-medium text-left"
        >
          Azion Console
        </h3>
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <label
              for="email"
              class="font-semibold text-sm"
              :class="{ 'p-error': errors.email }"
            >
              Email
            </label>
            <InputText
              v-model="email"
              id="email"
              placeholder="example@email.com"
              type="email"
              autofocus
              @keydown.enter="checkLoginMethod"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small
              class="p-error text-xs font-normal leading-tight"
              v-if="errors.email"
              severity="error"
            >
              {{ errors.email }}
            </small>
          </div>

          <PrimeButton
            class="w-full flex-row-reverse"
            type="button"
            label="Next"
            :loading="isProccedButtonLoading"
            :disabled="!email"
            @click="checkLoginMethod"
          />
        </div>
        <div
          class="flex-col gap-6 sm:gap-8 flex"
          v-if="showSocialIdps"
        >
          <Divider align="center">
            <p>or</p>
          </Divider>
        </div>

        <SocialIdpsBlock
          :socialIdpsService="listSocialIdpsService"
          v-model:showSocialIdps="showSocialIdps"
        />
      </div>

      <div class="flex flex-wrap justify-center items-center pt-6 gap-3">
        <div>Don't have an account?</div>
        <PrimeButton
          severity="secondary"
          label="Create One"
          @click="goToSignup"
        />
      </div>
    </div>

    <!-- Password step -->
    <div
      v-else
      class="flex flex-col align-top items-center animate-fadeIn"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 sm:p-8 rounded-md flex-col gap-6 flex"
      >
        <div class="flex flex-col gap-6 sm:gap-8">
          <h3 class="text-xl md:text-2xl font-medium">Azion Console</h3>
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
          <div class="flex flex-col gap-2">
            <label
              for="password"
              class="font-semibold text-sm"
              :class="{ 'p-error': hasRequestErrorMessage }"
            >
              Password
            </label>
            <Password
              toggleMask
              v-model="password"
              id="password"
              class="w-full"
              :class="{ 'p-invalid': hasRequestErrorMessage }"
              @keydown.enter="validateAndSubmit"
              :feedback="false"
            />
            <small
              class="p-error text-xs font-normal leading-tight"
              v-if="hasRequestErrorMessage"
            >
              {{ hasRequestErrorMessage }}
            </small>
          </div>
        </div>
        <div>
          <PrimeButton
            link
            class="p-0"
            label="Forgot Password?"
            @click="$emit('goToForgotPassword', true)"
          />
        </div>
        <PrimeButton
          class="w-full flex-row-reverse"
          :loading="isButtonLoading"
          label="Sign In"
          type="button"
          @click="validateAndSubmit"
          :disabled="!password"
        />
      </div>

      <div class="flex flex-wrap justify-center items-center pt-6 gap-3">
        <div>Don't have an account?</div>
        <PrimeButton
          severity="secondary"
          label="Create One"
          @click="goToSignup"
        />
      </div>
    </div>
  </form>
</template>

<script setup>
  import { ProccessRequestError, UnexpectedError, UserNotFoundError } from '@/services/axios/errors'
  import { verifyLoginMethodService } from '@/services/auth-services/get-login-method-service'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import Password from 'primevue/password'
  import SocialIdpsBlock from '@/templates/social-idps-block'
  import { useField, useForm } from 'vee-validate'
  import { ref, inject, onMounted } from 'vue'
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
    },
    listSocialIdpsService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const toast = useToast()

  const verifyErrorsOnUrl = () => {
    const { error_description: errorMessage } = route.query

    if (errorMessage) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
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
        window.location.replace(`${res.loginUrl}?email=${encodedEmail}&console=true`)
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
</script>
