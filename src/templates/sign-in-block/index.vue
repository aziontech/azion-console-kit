<template>
  <form @submit.prevent="validateAndSubmit">
    <!-- Email step -->
    <div
      class="flex flex-col align-top items-center p-4 animate-fadeIn"
      v-if="!showPassword"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-6 flex"
      >
        <div class="text-xl md:text-2xl font-medium">Real-Time Manager</div>
        <div class="flex flex-col gap-2">
          <label
            for="email"
            class="font-semibold text-sm"
            >Email</label
          >
          <InputText
            v-bind="email"
            id="email"
            placeholder="example@email.com"
            type="email"
            class="w-full"
            :class="{ 'p-invalid': errors.email }"
            v-tooltip.top="{ value: errors.email, showDelay: 200 }"
          />
        </div>

        <PrimeButton
          class="w-full flex-row-reverse"
          type="button"
          label="Next"
          :loading="isProccedButtonLoading"
          severity="secondary"
          :disabled="errors.email || !email.value"
          @click="showPasswordStep()"
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

      <div class="flex flex-wrap justify-center items-center pt-6">
        <div>Don't have an account?</div>
        <PrimeButton
          link
          label="Create One"
        ></PrimeButton>
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
        <div class="text-xl md:text-2xl font-medium">Real Time Manager</div>
        <div class="flex items-center gap-2">
          <PrimeButton
            class="w-7 h-7"
            outlined
            icon="pi pi-chevron-left"
            @click="showPassword = false"
          ></PrimeButton>
          <p class="text-sm">{{ email.value }}</p>
        </div>

        <div class="flex flex-col gap-2">
          <label
            for="password"
            class="font-semibold text-sm"
            >Password</label
          >
          <div>
            <Password
              toggleMask
              v-model="password"
              id="password"
              class="w-full"
              placeholder="P@ssw0rd123"
              :class="{ 'p-invalid': errorPassword }"
              :feedback="false"
              v-tooltip.top="{ value: errorPassword, showDelay: 200 }"
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
          ></PrimeButton>
        </div>
        <PrimeButton
          class="w-full flex-row-reverse"
          :loading="isButtonLoading"
          label="Sign In"
          severity="secondary"
          type="submit"
          :disabled="errorPassword || !password"
        />
      </div>

      <div class="flex flex-wrap justify-center items-center pt-6">
        <div>Don't have an account?</div>
        <PrimeButton
          link
          label="Create One"
        ></PrimeButton>
      </div>
    </div>
  </form>
</template>

<script>
  export default {
    name: 'signInBlock'
  }
</script>

<script setup>
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import InlineMessage from 'primevue/inlinemessage'
  import Password from 'primevue/password'

  import * as yup from 'yup'

  import { useForm, useField } from 'vee-validate'
  import { ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    UserIsNotClientError,
    UserNotFoundError,
    ProccessRequestError
  } from '@/services/axios/errors'

  const router = useRouter()

  const showPassword = ref(false)
  const hasRequestErrorMessage = ref(null)
  const errorPassword = ref('')

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
    switchAccountLoginService: {
      type: Function,
      required: true
    }
  })

  const emailValidateRegex = /^\S+@\S+\.\S+$/

  const emailValidationSchema = yup.object({
    email: yup
      .string()
      .required('Email is a required field')
      .matches(emailValidateRegex, 'Invalid email address')
  })
  const passwordValidationSchema = yup.object({
    password: yup
      .string()
      .required('Password is a required field')
      .min(8, 'Password is too short. It should have at least 8 characters.')
  })

  const { defineInputBinds, errors } = useForm({
    validationSchema: emailValidationSchema,
    initialValues: {
      email: ''
    }
  })

  const email = defineInputBinds('email', { validateOnInput: true })
  const { value: password } = useField('password')

  const validatePassword = async (newPassword) => {
    try {
      await passwordValidationSchema.validate({
        password: newPassword
      })
      errorPassword.value = ''
    } catch (error) {
      errorPassword.value = error.errors[0]
    }
  }
  watch(password, validatePassword)

  const validateAndSubmit = async () => {
    try {
      isButtonLoading.value = true

      const loginData = {
        email: email.value.value,
        password: password.value,
        captcha: 'default'
      }
      await props.authenticationLoginService(loginData)
      const { user_tracking_info: userInfo } = await verify()
      await switchClientAccount(userInfo)
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

  const switchClientAccount = async (userInfo) => {
    let clientId
    try {
      const { account_id: accountId, client_id } = userInfo.props
      clientId = client_id
      await props.switchAccountLoginService(accountId)
      router.push('/')
    } catch {
      hasRequestErrorMessage.value = clientId
        ? new ProccessRequestError().message
        : new UserIsNotClientError().message
    }
  }

  const showPasswordStep = () => {
    isProccedButtonLoading.value = true
    setTimeout(() => {
      isProccedButtonLoading.value = false
      showPassword.value = true
    }, 500)
  }

  defineExpose({
    showPassword,
    showPasswordStep,
    email,
    password,
    errors,
    props,
    isButtonLoading,
    hasRequestErrorMessage,
    errorPassword
  })
</script>
