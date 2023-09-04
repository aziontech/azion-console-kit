<template>
  <form @submit.prevent="validateAndSubmit">
    <div class="flex items-center justify-center">
      <div class="p-4">
        <div class="surface-card p-4 shadow-2 border-round w-[400px]">
          <div class="text-center mb-5">
            <div class="text-900 text-3xl font-medium mb-3">Real Time Manager</div>
          </div>

          <div>
            {{ console.log(hasError) }}
            <Message
              severity="error"
              class="!mb-4"
              :closable="false"
              :hidden="!hasError"
              >User not found with the given credentials.</Message
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
      loginService: {
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
      const hasError = ref(false)

      const validateAndSubmit = async () => {
        console.log('IS VALIDATING')
        try {
          isLoading.value = true
          await props.loginService(formData.value)
        } catch (error) {
          hasError.value = true
          isLoading.value = false
        }
      }

      // Retornar todas as referências necessárias
      return {
        formData,
        hasError,
        isLoading,
        validateAndSubmit
      }
    }
  }
</script>
