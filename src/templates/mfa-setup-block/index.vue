<template>
  <form
    @submit.prevent="authorizeDevice()"
    class="max-sm:min-h-[calc(100vh-120px)] justify-center items-center"
  >
    <div
      class="flex flex-col align-top items-center py-6 px-3 md:py-20 animate-fadeIn"
      @paste="handlePaste"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 md:p-8 rounded-md flex-col gap-8 inline-flex"
      >
        <div class="flex flex-col gap-3">
          <div class="text-xl md:text-xl font-medium">Set up Multi-factor Authentication (MFA)</div>

          <!-- Steps -->
          <ul class="list-decimal text-color-secondary list-inside">
            <li>
              Install
              <PrimeButton
                link
                label="Google Authenticator"
                class="p-0"
                @click="props.openGoogleAuthenticatorAppDocumentation"
              ></PrimeButton>
              on your device.
            </li>
            <li>Open the app and tap "+" button.</li>
            <li>Tap ”Scan QR Code” and point your phone camera to the code below.</li>
          </ul>
        </div>

        <!-- QR Code -->
        <div class="flex flex-wrap justify-center items-center">
          <Skeleton
            v-show="!qrCode.url"
            class="w-[10rem] h-[10rem] sm:w-[12.5rem] sm:h-[12.5rem]"
          />
          <QrcodeVue
            v-show="qrCode.url"
            :value="qrCode?.url"
            level="H"
            :size="250"
            class="bg-white w-[10rem] h-[10rem] sm:w-[12.5rem] sm:h-[12.5rem] rounded-md surface-border border p-2"
          />
        </div>

        <InlineMessage
          v-if="hasRequestErrorMessage"
          severity="error"
          class="animate-fadeIn"
          >{{ hasRequestErrorMessage }}</InlineMessage
        >
        <div>
          <label class="font-semibold text-xs">After scanning, enter the 6-digit code</label>
          <div class="flex flex-wrap gap-1.5 sm:gap-4 mt-4">
            <InputText
              v-for="(digits, i) in digitsMfa"
              :key="i"
              maxlength="1"
              class="grow w-7 sm:w-11 h-[2.6rem] text-lg text-center"
              v-model="digits.value.value"
              :disabled="isButtonLoading"
              @keydown="(event) => moveFocus(i, event)"
              :ref="(el) => (inputRefs[i] = el)"
            />
          </div>
        </div>

        <PrimeButton
          class="w-full flex-row-reverse"
          label="Verify code"
          :loading="isButtonLoading"
          severity="secondary"
          type="submit"
        />
      </div>
    </div>
  </form>
</template>

<script>
  export default {
    name: 'mfaSetupBlock'
  }
</script>

<script setup>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import InlineMessage from 'primevue/inlinemessage'
  import Skeleton from 'primevue/skeleton'
  import QrcodeVue from 'qrcode.vue'

  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    generateQrCodeMfaService: {
      required: true,
      type: Function
    },
    validateMfaCodeService: {
      required: true,
      type: Function
    },
    verifyAuthenticationService: {
      required: true,
      type: Function
    },
    openGoogleAuthenticatorAppDocumentation: {
      required: true,
      type: Function
    },
    accountHandler: {
      required: true,
      type: Object
    }
  })

  const router = useRouter()

  const MFA_CODE_LENGTH = 6
  const digitsMfa = Array.from({ length: MFA_CODE_LENGTH }, () => ref({ value: '' }))
  const inputRefs = ref(Array.from({ length: MFA_CODE_LENGTH }, () => null))

  const qrCode = ref('')
  const hasRequestErrorMessage = ref('')
  const isButtonLoading = ref(false)

  const handlePaste = (event) => {
    event.preventDefault()
    const pastedData = event.clipboardData.getData('text')

    for (let mfaDigitIndex = 0; mfaDigitIndex < pastedData.length; mfaDigitIndex++) {
      digitsMfa[mfaDigitIndex].value.value = pastedData[mfaDigitIndex]
    }

    const allDigitsFilled = () => validateCodeLength() === 6
    if (allDigitsFilled()) {
      authorizeDevice()
    }
  }

  const moveFocus = (index, event) => {
    //clear the invalide input
    const clearDigitValue = (index) => (digitsMfa[index].value.value = '')

    //check delete code
    if (event.key === 'Backspace' || event.keyCode === 8) {
      const nextInput = inputRefs.value[index - 1]
      if (index) {
        nextInput.$el.focus()
      }
      digitsMfa[index].value.value = ''
    } else {
      //check code value
      const isInvalidCode = (digitCode) => isNaN(parseFloat(digitCode))
      if (isInvalidCode(event.key)) {
        clearDigitValue(index)
        return
      }

      if (index < MFA_CODE_LENGTH - 1) {
        //get the next input
        const nextInput = inputRefs.value[index + 1]
        digitsMfa[index].value.value = parseInt(event.key)
        setTimeout(() => nextInput.$el.focus(), 100)
      }

      if (index === MFA_CODE_LENGTH - 1) {
        //set the last value
        digitsMfa[index].value.value = parseInt(event.key)
      }

      const allDigitsFilled = () => validateCodeLength() === 6
      if (allDigitsFilled()) {
        //validate code
        authorizeDevice()
      }
    }
  }

  const validateCodeLength = () => {
    const code = digitsMfa.map((digit) => digit.value.value).join('')

    return code.trim().length
  }

  const getQrCodeSetupUrl = async () => {
    try {
      qrCode.value = await props.generateQrCodeMfaService()
    } catch (error) {
      router.push({ name: 'login' })
    }
  }
  onMounted(async () => {
    getQrCodeSetupUrl()
  })

  const joinDigitsMfa = () => {
    return digitsMfa.map((digit) => digit.value.value).join('')
  }

  const verifyUserData = async () => {
    try {
      return await props.verifyAuthenticationService()
    } catch (err) {
      router.push({ name: 'login' })
    }
  }

  const authorizeDevice = async () => {
    try {
      isButtonLoading.value = true
      const mfaToken = joinDigitsMfa()
      await props.validateMfaCodeService(mfaToken)
      const { user_tracking_info: userInfo } = await verifyUserData()
      const redirect = await props.accountHandler.switchAndReturnAccountPage(
        userInfo.props.account_id
      )
      router.push(redirect)
    } catch (error) {
      hasRequestErrorMessage.value = error
      digitsMfa.forEach((item) => (item.value.value = ''))
    } finally {
      isButtonLoading.value = false
    }
  }
</script>
