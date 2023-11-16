<template>
  <form
    class="max-sm:min-h-[calc(100vh-120px)]"
    @submit.prevent
  >
    <!-- Email step -->
    <div
      class="flex flex-col align-top items-center p-4 animate-fadeIn max-sm:px-3 max-sm:py-6"
      v-if="!showPassword"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-6 flex"
      >
        <div
          data-testid="title"
          class="text-xl md:text-2xl font-medium"
        >
          Real-Time Manager
        </div>
        <div class="flex flex-col gap-2">
          <label
            for="email"
            class="font-semibold text-sm"
          >
            Email
          </label>
          <InputText
            v-model="email"
            id="email"
            placeholder="example@email.com"
            type="email"
            autofocus
            @keydown.enter="showPasswordStep"
            class="w-full"
            :class="{ 'p-invalid': hasErrorEmail }"
          />
        </div>

        <InlineMessage
          v-if="hasErrorEmail"
          severity="error"
          >{{ hasErrorEmail }}</InlineMessage
        >

        <PrimeButton
          class="w-full flex-row-reverse"
          type="button"
          label="Next"
          :loading="isProccedButtonLoading"
          :disabled="!email"
          @click="showPasswordStep"
        />

        <Divider align="center">
          <p>or</p>
        </Divider>

        <div class="flex flex-col gap-4">
          <PrimeButton
            class="w-full"
            label="Continue with Google"
            severity="primary"
            icon="pi pi-google"
            outlined
          />
          <PrimeButton
            class="w-full"
            label="Continue with GitHub"
            severity="primary"
            icon="pi pi-github"
            outlined
          />
        </div>
      </div>

      <div class="flex flex-wrap justify-center items-center pt-6 gap-3">
        <div>Don't have an account?</div>
        <PrimeButton
          severity="secondary"
          label="Create One"
          @click="$router.push({ name: 'signup' })"
        />
      </div>
    </div>

    <!-- Password step -->
    <div
      v-else
      class="flex flex-col align-top items-center p-4 animate-fadeIn"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-6 flex"
      >
        <div class="text-xl md:text-2xl font-medium">Real-Time Manager</div>
        <div class="flex items-center gap-2">
          <PrimeButton
            v-tooltip.top="{ value: 'Back', showDelay: 200 }"
            class="w-7 h-7"
            outlined
            icon="pi pi-chevron-left"
            @click="resetPasswordStep"
          ></PrimeButton>
          <p class="text-sm">{{ email }}</p>
        </div>

        <div class="flex flex-col gap-2">
          <label
            for="password"
            class="font-semibold text-sm"
          >
            Password
          </label>
          <div>
            <Password
              toggleMask
              v-model="password"
              id="password"
              class="w-full"
              :class="{ 'p-invalid': hasRequestErrorMessage }"
              @keydown.enter="validateAndSubmit"
              :feedback="false"
            />
          </div>
        </div>

        <InlineMessage
          v-if="hasRequestErrorMessage"
          severity="error"
          >{{ hasRequestErrorMessage }}</InlineMessage
        >

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
          @click="$router.push({ name: 'signup' })"
        />
      </div>
    </div>
  </form>
</template>

<script setup>
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import InlineMessage from 'primevue/inlinemessage'
  import Password from 'primevue/password'
  import * as yup from 'yup'
  import { useField, useForm } from 'vee-validate'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { UserNotFoundError, ProccessRequestError } from '@/services/axios/errors'

  defineOptions({ name: 'signInBlock' })

  const router = useRouter()

  const showPassword = ref(false)
  const hasRequestErrorMessage = ref(false)
  const isProccedButtonLoading = ref(false)
  const isButtonLoading = ref(false)
  const hasErrorEmail = ref(false)

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
    switchAccountLoginService: {
      type: Function,
      required: true
    },
    listTypeAccountService: {
      type: Function,
      required: true
    }
  })

  const emailValidateRegex = /^\S+@\S+\.\S+$/

  const validationSchema = yup.object({
    email: yup.string().matches(emailValidateRegex, 'Email must be a valid email'),
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

  const validateAndSubmit = async () => {
    try {
      if (!password.value) return
      isButtonLoading.value = true
      hasRequestErrorMessage.value = false

      const loginData = {
        email: values.email,
        password: values.password,
        captcha: 'default'
      }

      await props.authenticationLoginService(loginData)
      const { twoFactor, trustedDevice } = await verify()

      if (twoFactor) {
        const mfaRoute = trustedDevice ? 'authentication' : 'setup'
        router.push(`/mfa/${mfaRoute}`)
        return
      }

      await switchClientAccount()
    } catch {
      hasRequestErrorMessage.value = new UserNotFoundError().message
    } finally {
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

  const searchAccount = async () => {
    //deprecated: method will be replaced by an api in the future
    try {
      const accountTypes = ['brands', 'resellers', 'groups', 'clients']

      for (const typeAccount of accountTypes) {
        const { results: [firstResult] = [] } = await props.listTypeAccountService({
          type: typeAccount,
          page_size: 1
        })

        if (firstResult) {
          return firstResult
        }
      }
    } catch (error) {
      throw new error()
    }
  }

  const switchClientAccount = async () => {
    try {
      const account = await searchAccount()
      const { first_login: firstLogin } = await props.switchAccountLoginService(account.id)
      if (firstLogin) {
        router.push({ name: 'additional-data' })
        return
      }
      router.push({ name: 'home' })
    } catch {
      hasRequestErrorMessage.value = new ProccessRequestError().message
    }
  }

  const showPasswordStep = () => {
    hasErrorEmail.value = errors.value.email
    if (hasErrorEmail.value || !email.value) return

    isProccedButtonLoading.value = true
    setTimeout(() => {
      isProccedButtonLoading.value = false
      showPassword.value = true
      resetField()
    }, 500)
  }

  const resetPasswordStep = () => {
    hasRequestErrorMessage.value = false
    hasErrorEmail.value = false
    showPassword.value = false
    resetField()
  }
</script>
