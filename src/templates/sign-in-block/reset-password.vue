<template>
  <form @submit.prevent="resetPassword()">
    <div class="flex flex-col align-top items-center animate-fadeIn">
      <div
        v-if="!isPasswordReseted"
        class="surface-card surface-border border max-w-md w-full p-6 sm:p-8 rounded-md flex-col sm:gap-8 gap-6 inline-flex"
      >
        <h3 class="text-xl md:text-2xl font-medium">Reset Password</h3>

        <InlineMessage v-if="requestError">{{ requestError }}</InlineMessage>

        <div class="flex flex-col gap-2">
          <label
            for="password"
            class="font-semibold text-sm"
            >New Password</label
          >
          <div>
            <Password
              toggleMask
              v-model="password"
              id="password"
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
              :feedback="false"
            />
          </div>
          <small class="p-error text-xs font-normal leading-tight">{{ errors.password }}</small>

          <ul class="text-color-secondary list-inside space-y-3">
            <span class="font-semibold text-sm text-color">Must have at least:</span>
            <li
              class="flex gap-3 items-center text-color-secondary"
              :key="i"
              v-for="(requirement, i) in passwordRequirementsList"
            >
              <div class="w-3">
                <div
                  class="w-2 h-2 bg-orange-bullet animate-fadeIn"
                  v-if="!requirement.valid"
                ></div>
                <div
                  class="pi pi-check text-sm text-success-check animate-fadeIn"
                  v-else
                ></div>
              </div>

              <div>
                {{ requirement.label }}
              </div>
            </li>
          </ul>
        </div>

        <div class="flex flex-col gap-2">
          <label
            for="confirm-password"
            class="font-semibold text-sm"
            >Confirm Password</label
          >
          <div class="flex flex-col gap-2">
            <Password
              toggleMask
              v-model="confirmPassword"
              id="confirm-password"
              class="w-full"
              :class="{ 'p-invalid': errors.confirmPassword }"
              :feedback="false"
            />
            <InlineMessage
              v-if="isMatchError"
              severity="error"
            >
              {{ errors.confirmPassword }}
            </InlineMessage>
            <small
              v-if="otherPasswordErrors"
              class="p-error text-xs font-normal leading-tight"
            >
              {{ errors.confirmPassword }}
            </small>
          </div>
        </div>
        <PrimeButton
          class="w-full flex-row-reverse"
          :loading="isButtonLoading"
          label="Reset Password"
          severity="secondary"
          type="submit"
          :disabled="!meta.valid"
        />
      </div>

      <div
        v-if="isPasswordReseted"
        class="flex flex-col align-top items-center p-4 animate-fadeIn"
      >
        <div
          class="surface-card surface-border border max-w-md w-full p-6 md:p-8 rounded-md flex-col gap-8 inline-flex"
        >
          <div class="flex flex-col gap-3">
            <div class="text-xl md:text-2xl font-medium">Password Reset Complete</div>
            <p class="text-color-secondary">
              Your password has been successfully reset. Sign in to Azion Console to use Azion
              products and services.
            </p>
          </div>

          <PrimeButton
            class="w-full flex-row-reverse"
            :loading="isButtonLoading"
            label="Sign In"
            @click="goToSignIn()"
            severity="secondary"
            type="button"
          />
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
  import Password from 'primevue/password'
  import PrimeButton from 'primevue/button'
  import InlineMessage from 'primevue/inlinemessage'
  import * as yup from 'yup'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useField, useForm } from 'vee-validate'

  const MATCH_ERROR_MESSAGE = 'The passwords do not match'
  const isMatchError = computed(() => {
    return errors.value.confirmPassword === MATCH_ERROR_MESSAGE
  })
  const otherPasswordErrors = computed(() => {
    return errors.value.confirmPassword !== MATCH_ERROR_MESSAGE
  })

  const isButtonLoading = ref(false)
  const isPasswordReseted = ref(false)
  const requestError = ref('')
  const passwordRequirementsList = ref([
    { label: '> 7 characters', valid: false },
    { label: 'Uppercase letter', valid: false },
    { label: 'Lowercase letter', valid: false },
    { label: 'Special character (e.g. !?<>@#$%)', valid: false }
  ])

  const props = defineProps({
    resetPasswordService: { type: Function, required: true }
  })

  const validationSchema = yup.object({
    password: yup
      .string()
      .required('Password is a required field')
      .test('max', 'Exceeded number of characters', (value) => value?.length <= 128)
      .test('noSpaces', 'Spaces are not allowed', (value) => !value?.match(/\s/g))
      .test('requirements', '', (value) => {
        const hasUpperCase = value && /[A-Z]/.test(value)
        const hasLowerCase = value && /[a-z]/.test(value)
        const hasSpecialChar = value && /[!@#$%^&*(),.?":{}|<>]/.test(value)
        const hasMinLength = value?.length > 7
        passwordRequirementsList.value[0].valid = hasMinLength
        passwordRequirementsList.value[1].valid = hasUpperCase
        passwordRequirementsList.value[2].valid = hasLowerCase
        passwordRequirementsList.value[3].valid = hasSpecialChar
        return hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar
      }),
    confirmPassword: yup
      .string()
      .required('Confirm Password is a required field')
      .test('match', MATCH_ERROR_MESSAGE, (value) => value === values.password)
  })

  const { errors, values, meta } = useForm({ validationSchema })
  const { value: password } = useField('password')
  const { value: confirmPassword } = useField('confirmPassword')

  const route = useRoute()
  const resetPassword = async () => {
    try {
      isButtonLoading.value = true
      const { uidb64, token } = route.params

      const payload = {
        password: values.password,
        uidb64,
        token
      }
      await props.resetPasswordService(payload)

      isPasswordReseted.value = true
    } catch (err) {
      requestError.value = err
    } finally {
      isButtonLoading.value = false
    }
  }

  const router = useRouter()
  const goToSignIn = () => {
    isButtonLoading.value = true
    setTimeout(() => {
      isButtonLoading.value = false
      router.push({ name: 'login' })
    }, 500)
  }
</script>
