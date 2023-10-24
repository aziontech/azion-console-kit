<template>
  <form @submit.prevent="validateAndSubmit">
    <Transition
      name="fade"
      mode="out-in"
    >
      <!-- Email step -->
      <div
        class="flex flex-col align-top items-center p-4 transition-opacity duration-500 ease-in-out"
        v-if="!showPassword"
      >
        <div
          class="surface-card border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-6 inline-flex"
        >
          <div class="text-xl md:text-2xl font-medium">Real Time Manager</div>
          <div class="flex flex-col gap-2">
            <label
              for="email"
              class="font-semibold text-sm"
              >E-mail</label
            >
            <InputText
              v-bind="email"
              id="email"
              placeholder="Type your e-mail"
              type="email"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
              v-tooltip.top="errors.email"
            />
          </div>

          <PrimeButton
            class="w-full"
            type="button"
            label="Proceed"
            severity="secondary"
            :disabled="errors.email || !email.value"
            @click="showPassword = true"
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
            label="Create one now"
          ></PrimeButton>
        </div>
      </div>

      <!-- Password step -->
      <div
        v-else
        class="flex flex-col align-top items-center p-4 transition-opacity duration-500 ease-in-out"
      >
        <div
          class="surface-card border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-6 inline-flex"
        >
          <div class="text-xl md:text-2xl font-medium">Real Time Manager</div>
          <div class="flex items-center gap-2">
            <PrimeButton
              class="w-7 h-7"
              outlined
              icon="pi pi-chevron-left"
              @click="showPassword = false"
            ></PrimeButton>
            <p class="text-sm">peterson@azion.com</p>
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="password"
              class="font-semibold text-sm"
              >Password</label
            >
            <InputText
              v-bind="password"
              id="password"
              placeholder="Type your password"
              type="password"
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              v-tooltip.top="errors.password"
            />
          </div>

          <InlineMessage
            v-if="hasErrorMessage"
            severity="error"
            >{{ hasErrorMessage }}</InlineMessage
          >

          <div>
            <PrimeButton
              link
              class="p-0"
              label="Forgot my password"
            ></PrimeButton>
          </div>
          <PrimeButton
            class="w-full"
            :loading="isButtonLoading"
            label="Sign in"
            severity="secondary"
            type="submit"
            :disabled="errors.password || !password.value"
          />
        </div>

        <div class="flex flex-wrap justify-center items-center pt-6">
          <div>Don't have an account?</div>
          <PrimeButton
            link
            label="Create one now"
          ></PrimeButton>
        </div>
      </div>
    </Transition>
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
  import * as yup from 'yup'

  import { useForm } from 'vee-validate'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const showPassword = ref(false)
  const hasErrorMessage = ref(null)
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

  const emailValidateRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

  const validationSchema = yup.object({
    email: yup.string().required().matches(emailValidateRegex, 'Invalid email address'),
    password: yup.string().required().min(8, 'Password is too short - should be 8 chars minimum.')
  })
  const { defineInputBinds, errors } = useForm({
    validationSchema,
    initialValues: {
      email: '',
      password: ''
    }
  })

  const email = defineInputBinds('email', { validateOnInput: true })
  const password = defineInputBinds('password', { validateOnInput: true })

  const validateAndSubmit = async () => {
    try {
      isButtonLoading.value = true

      const loginData = {
        email: email.value.value,
        password: password.value.value,
        captcha: 'default'
      }
      await props.authenticationLoginService(loginData)
      const { user_tracking_info: userInfo } = await verify()
      await switchClientAccount(userInfo)
    } catch (err) {
      hasErrorMessage.value = `E-mail and password don't match with any account.`
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
      hasErrorMessage.value = clientId
        ? 'Error while processing request.'
        : 'User must be of type client.'
    }
  }

  defineExpose({
    showPassword,
    email,
    password,
    errors,
    props,
    isButtonLoading,
    hasErrorMessage
  })
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
</style>
