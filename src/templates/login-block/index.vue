<template>
  <form @submit.prevent="validateAndSubmit">
    <div class="flex items-center justify-center">
      <div class="p-4">
        <div class="surface-card p-4 shadow-2 border-round w-[400px]">
          <div class="text-center mb-5">
            <div class="text-900 text-3xl font-medium mb-3">Real Time Manager</div>
          </div>

          <div>
            <Message
              severity="error"
              class="!mb-4"
              :closable="false"
              :hidden="!hasErrorMessage"
              >{{ hasErrorMessage }}</Message
            >

            <label
              for="email"
              class="block text-900 font-medium mb-2"
              >Email</label
            >
            <InputText
              v-model="formData.email"
              id="email"
              type="email"
              class="w-full mb-3"
            />

            <label
              for="password"
              class="block text-900 font-medium mb-2"
              >Password</label
            >
            <InputText
              v-model="formData.password"
              id="password"
              type="password"
              class="w-full mb-3"
            />

            <div class="flex align-items-center justify-content-between mb-6">
              <div class="flex align-items-center">
                <Checkbox
                  v-model="formData.rememberMe"
                  id="rememberme"
                  binary
                  class="mr-2"
                />
                <label for="rememberme">Keep me logged in</label>
              </div>
              <a class="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
                >Forgot password?</a
              >
            </div>

            <PrimeButton
              class="w-full"
              type="submit"
              :loading="isLoading"
              icon="pi pi-user"
              label="Sign in"
            />
          </div>
          <div class="text-center pt-4">
            <span class="text-600 font-medium line-height-3">Don't have an account?</span>
            <a class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">Create one now</a>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import Checkbox from 'primevue/checkbox'
  import InputText from 'primevue/inputtext'
  import Message from 'primevue/message'
  import PrimeButton from 'primevue/button'

  export default {
    name: 'login-block',
    components: {
      Checkbox,
      InputText,
      Message,
      PrimeButton
    },
    props: {
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
    },
    setup(props) {
      const formData = ref({
        email: '',
        password: '',
        captcha: 'default'
      })

      const isLoading = ref(false)
      const hasErrorMessage = ref(null)
      const router = useRouter()

      const validateAndSubmit = async () => {
        try {
          isLoading.value = true
          await props.authenticationLoginService(formData.value)
          const { user_tracking_info: userInfo } = await verify()
          await switchClientAccount(userInfo)
        } catch {
          hasErrorMessage.value = 'User not found with the given credentials.'
          isLoading.value = false
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
          isLoading.value = false
        }
      }

      return {
        formData,
        hasErrorMessage,
        isLoading,
        validateAndSubmit
      }
    }
  }
</script>
