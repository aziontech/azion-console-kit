<template>
  <form @submit.prevent="validateCode()">
    <div
      class="flex flex-col align-top items-center py-6 px-3 md:py-20 animate-fadeIn"
      @paste="handlePaste"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-10 inline-flex"
      >
        <div class="flex flex-col gap-3">
          <div class="text-xl font-medium">Authenticate your account</div>
          <div class="text-color-secondary">
            Confirm your account by opening your Google Authenticator app and enter the code for
            Azion.
          </div>
        </div>

        <div>
          <label class="font-semibold text-xs">Verification code</label>
          <div class="flex flex-wrap gap-1.5 sm:gap-4 mt-4">
            <InputText
              v-for="(digits, i) in digitsMfa"
              :key="i"
              class="grow w-7 sm:w-11 h-[2.6rem] text-lg text-center"
              v-model="digits.value.value"
              @input="moveFocus(i)"
              :ref="(el) => (inputRefs[i] = el)"
            />
          </div>
        </div>

        <InlineMessage
          v-if="hasRequestErrorMessage"
          severity="error"
          >{{ hasRequestErrorMessage }}</InlineMessage
        >

        <PrimeButton
          class="w-full flex-row-reverse"
          label="Confirm code"
          :loading="isButtonLoading"
          severity="primary"
          type="submit"
        />
      </div>
    </div>
  </form>
</template>

<script>
  export default {
    name: 'mfaAuthenticateBlock'
  }
</script>

<script setup>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import InlineMessage from 'primevue/inlinemessage'

  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { UserIsNotClientError, ProccessRequestError } from '@/services/axios/errors'

  const props = defineProps({
    validateMfaCodeService: {
      required: true,
      type: Function
    },
    verifyAuthenticationService: {
      required: true,
      type: Function
    },
    switchAccountService: {
      required: true,
      type: Function
    }
  })

  const MFA_CODE_LENGTH = 6
  const digitsMfa = Array.from({ length: MFA_CODE_LENGTH }, () => ref({ value: '' }))
  const inputRefs = ref(Array.from({ length: MFA_CODE_LENGTH }, () => null))

  const router = useRouter()
  const hasRequestErrorMessage = ref('')
  const isButtonLoading = ref(false)

  const handlePaste = (event) => {
    event.preventDefault()
    const pastedData = event.clipboardData.getData('text')

    for (let i = 0; i < pastedData.length; i++) {
      digitsMfa[i].value.value = pastedData[i]
    }
  }

  const moveFocus = (index) => {
    const { value: digitCode } = digitsMfa[index].value

    const clearDigitValue = (index) => (digitsMfa[index].value.value = '')

    const moveFocusToNextInput = (index) => {
      const nextInput = inputRefs.value[index + 1]
      if (nextInput) {
        nextInput.$el.focus()
      }
    }

    const isInvalidCode = (digitCode) => isNaN(digitCode) || digitCode.length > 1
    if (isInvalidCode(digitCode)) {
      clearDigitValue(index)
      return
    }

    const shouldMoveFocus = (digitCode, index) => digitCode !== '' && index < MFA_CODE_LENGTH - 1
    if (shouldMoveFocus(digitCode, index)) {
      moveFocusToNextInput(index)
    }

    const allDigitsFilled = () => joinDigitsMfa().length === 6
    if (allDigitsFilled()) {
      validateCode()
    }
  }

  const joinDigitsMfa = () => {
    return digitsMfa.map((digit) => digit.value.value).join('')
  }

  const validateCode = async () => {
    try {
      isButtonLoading.value = true

      const mfaToken = joinDigitsMfa()
      await props.validateMfaCodeService(mfaToken)

      const { user_tracking_info: userInfo } = await verifyUserData()
      await switchClientAccount(userInfo)
    } catch (error) {
      hasRequestErrorMessage.value = error
    } finally {
      isButtonLoading.value = false
    }
  }

  const verifyUserData = async () => {
    try {
      return await props.verifyAuthenticationService()
    } catch (err) {
      router.push({ name: 'login' })
    }
  }

  const switchClientAccount = async (userInfo) => {
    let clientId
    try {
      const { account_id: accountId, client_id } = userInfo.props
      clientId = client_id
      await props.switchAccountService(accountId)
      router.push({ name: 'home' })
    } catch {
      hasRequestErrorMessage.value = clientId
        ? new ProccessRequestError().message
        : new UserIsNotClientError().message
    }
  }
</script>
