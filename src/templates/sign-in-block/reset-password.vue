<template>
  <form @submit.prevent="resetPassword()">
    <div class="flex flex-col align-top items-center p-4 animate-fadeIn">
      <div
        v-if="!isPasswordReseted"
        class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-10 inline-flex"
      >
        <div class="text-xl md:text-2xl font-medium">Reset Password</div>

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
              :class="{ 'p-invalid': errorPassword }"
              :feedback="false"
              v-tooltip.top="errorPassword"
            />
          </div>

          <ul class="text-color-secondary list-inside space-y-3">
            <li
              class="flex gap-3 items-center text-color-secondary"
              :key="i"
              v-for="(requirement, i) in passwordRequirementsList"
            >
              <div class="w-3">
                <div
                  class="w-2 h-2 bg-[#F3652B] animate-fadeIn"
                  v-if="!requirement.valid"
                ></div>
                <div
                  class="pi pi-check text-sm text-[#22C55E] animate-fadeIn"
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
          <div>
            <Password
              toggleMask
              v-model="confirmPassword"
              id="confirm-password"
              class="w-full"
              :class="{ 'p-invalid': errorConfirmation }"
              :feedback="false"
              v-tooltip.top="errorConfirmation"
            />
          </div>
        </div>
        <PrimeButton
          class="w-full flex-row-reverse"
          :loading="isButtonLoading"
          label="Reset Password"
          severity="primary"
          type="submit"
          :disabled="hasInvalidRequirement() || !confirmationIsValid"
        />
      </div>

      <div
        v-if="isPasswordReseted"
        class="flex flex-col align-top items-center p-4 animate-fadeIn"
      >
        <div
          class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-10 inline-flex"
        >
          <div class="flex flex-col gap-3">
            <div class="text-xl md:text-2xl font-medium">Password Reset Complete</div>
            <p class="text-color-secondary">
              Your password has been successfully reset. Sign in to Real-Time Manager to use Azion services.
            </p>
          </div>

          <PrimeButton
            class="w-full flex-row-reverse"
            :loading="isButtonLoading"
            label="Sign In"
            @click="goToSignIn()"
            severity="primary"
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
  import { watch, ref, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useField } from 'vee-validate'

  const isButtonLoading = ref(false)
  const isPasswordReseted = ref(false)
  const errorPassword = ref('')
  const errorConfirmation = ref('')
  const requestError = ref('')
  const passwordRequirementsList = ref([
    { label: 'Must have at least:', valid: false },
    { label: '> 7 characters', valid: false },
    { label: '1 uppercase letter', valid: false },
    { label: '1 lowercase letter', valid: false },
    { label: '1 special character (example: !?<>@#$%)', valid: false }
  ])

  const props = defineProps({
    resetPasswordService: { type: Function, required: true }
  })

  const passwordValidationSchema = yup.object({
    password: yup.string().required('Password is a required field'),
    confirmPassword: yup
      .string()
      .test('match', 'The passwords do not match', (value) => !value || password.value === value)
      .required('Confirm Password is a required field')
  })

  const { value: password } = useField('password')
  const { value: confirmPassword } = useField('confirmPassword')

  const validatePasswordRequirements = (newPassword) => {
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    const hasMinimumLength = newPassword.length > 7

    passwordRequirementsList.value[0].valid = hasMinimumLength
    passwordRequirementsList.value[1].valid = hasUpperCase
    passwordRequirementsList.value[2].valid = hasLowerCase
    passwordRequirementsList.value[3].valid = hasSpecialCharacter
  }

  const hasInvalidRequirement = () => {
    return passwordRequirementsList.value.some((requirement) => !requirement.valid)
  }

  const validateConfirmationPassword = async (passwords) => {
    try {
      let newPassword = passwords[0]
      let newConfirmPassword = passwords[1] || ''

      validatePasswordRequirements(newPassword)

      await passwordValidationSchema.validate({
        password: newPassword,
        confirmPassword: newConfirmPassword
      })
      errorConfirmation.value = ''
    } catch (error) {
      errorConfirmation.value = error.errors[0]
    }
  }
  const route = useRoute()
  const resetPassword = async () => {
    try {
      isButtonLoading.value = true
      const { uidb64, token } = route.params

      const payload = {
        password: password.value,
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

  watch([password, confirmPassword], validateConfirmationPassword)

  const confirmationIsValid = computed(() => {
    return !errorConfirmation.value && confirmPassword.value
  })

  defineExpose({
    isButtonLoading,
    errorPassword,
    errorConfirmation,
    props,
    password,
    confirmPassword,
    goToSignIn,
    confirmationIsValid,
    passwordRequirementsList,
    hasInvalidRequirement,
    validateConfirmationPassword
  })
</script>
