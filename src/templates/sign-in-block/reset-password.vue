<template>
  <form @submit.prevent="resetPassword()">
    <div class="flex flex-col align-top items-center animate-fadeIn">
      <div
        v-if="!isPasswordReseted"
        class="surface-card surface-border border max-w-md w-full p-6 sm:p-8 rounded-md flex-col sm:gap-8 gap-6 inline-flex"
      >
        <h3 class="text-xl md:text-2xl font-medium">Reset Password</h3>

        <InlineMessage v-if="requestError">{{ requestError }}</InlineMessage>

        <FieldPassword
          name="password"
          label="New Password"
          showStrength
          required
          :additionalError="errors.password"
          @strength="onStrengthChange"
        />

        <div class="flex flex-col gap-2">
          <FieldPassword
            name="confirmPassword"
            label="Confirm Password"
            required
            :additionalError="confirmPasswordError"
          />
          <InlineMessage
            v-if="isMatchError"
            severity="error"
          >
            {{ errors.confirmPassword }}
          </InlineMessage>
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
  import PrimeButton from '@aziontech/webkit/button'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import FieldPassword from '@aziontech/webkit/field-password'
  import { useForm } from 'vee-validate'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'

  const MATCH_ERROR_MESSAGE = 'The passwords do not match'
  const isMatchError = computed(() => {
    return errors.value.confirmPassword === MATCH_ERROR_MESSAGE
  })
  const confirmPasswordError = computed(() => {
    if (errors.value.confirmPassword === MATCH_ERROR_MESSAGE) return ''
    return errors.value.confirmPassword || ''
  })

  const isButtonLoading = ref(false)
  const isPasswordReseted = ref(false)
  const requestError = ref('')
  const passwordStrength = ref(null)

  const onStrengthChange = (strength) => {
    passwordStrength.value = strength
  }

  const props = defineProps({
    resetPasswordService: { type: Function, required: true },
    passwordSettingService: { type: Function, required: true }
  })

  const validationSchema = yup.object({
    password: yup
      .string()
      .required('Password is a required field')
      .test('max', 'Exceeded number of characters', (value) => value?.length <= 128)
      .test('noSpaces', 'Spaces are not allowed', (value) => !value?.match(/\s/g))
      .test('requirements', 'Password does not meet requirements.', () => {
        return passwordStrength.value?.level === 'strong'
      }),
    confirmPassword: yup
      .string()
      .required('Confirm Password is a required field')
      .test('match', MATCH_ERROR_MESSAGE, (value) => value === values.password)
  })

  const { errors, values, meta } = useForm({ validationSchema })

  const route = useRoute()
  const resetPassword = async () => {
    try {
      isButtonLoading.value = true
      const { uidb64, token } = route.params

      const payload = {
        password: values.password
      }

      if (!token) {
        payload.token = uidb64

        await props.passwordSettingService(payload)
      } else {
        payload.uidb64 = uidb64
        payload.token = token

        await props.resetPasswordService(payload)
      }

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
