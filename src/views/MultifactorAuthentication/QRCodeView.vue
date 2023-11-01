<template>
  <form @submit.prevent="resetPassword()">
    <div class="flex flex-col align-top items-center p-4 animate-fadeIn">
      <div
        class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-10 inline-flex"
      >
        <div class="flex flex-col gap-3">
          <div class="text-xl md:text-xl font-medium">Set up Multi-factor Authentication (MFA)</div>

          <!-- Steps -->
          <ul class="list-decimal text-color-secondary list-inside">
            <li>Intall Google Authenticator on your device.</li>
            <li>Open the app and tap "+" button.</li>
            <li>Tap ”Scan QR Code” and point your phone camera to the code below.</li>
          </ul>
        </div>

        <!-- QR Code -->
        <div>
          <div class="flex flex-wrap justify-center items-center mt-6">
            <PrimeButton
              link
              label="Cannot scan the QR code?"
            ></PrimeButton>
          </div>
        </div>

        <div>
          <label class="font-semibold text-xs">After scanning, enter the 6-digit code</label>
          <div class="flex gap-4 mt-4">
            <InputText
              v-for="(digits, i) in digitsMfa"
              :key="i"
              class="w-11"
              v-model="digits.value"
            />
          </div>
        </div>

        <PrimeButton
          class="w-full flex-row-reverse"
          label="Verify code"
          severity="primary"
          type="submit"
        />
      </div>
    </div>
  </form>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import { ref, onMounted } from 'vue'

  const props = defineProps({
    generateQrCodeService: {
      required: true,
      type: Function
    }
  })

  const digitsMfa = ref([
    { value: '' },
    { value: '' },
    { value: '' },
    { value: '' },
    { value: '' },
    { value: '' }
  ])

  onMounted(() => {
    props.generateQrCodeService()
  })
</script>
