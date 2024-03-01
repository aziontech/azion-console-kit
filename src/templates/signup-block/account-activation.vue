<template>
  <div
    class="align-items-center min-h-[calc(100vh-60px-56px)] w-full pt-4 pb-8 px-3 md:py-20 md:px-6"
  >
    <div
      class="card surface-border border rounded-md surface-section p-8 flex flex-col gap-8 max-w-md"
    >
      <section class="w-full flex flex-col gap-3">
        <h2 class="text-start text-xl font-medium">Check your inbox</h2>
        <p class="text-start text-color-secondary">
          We've sent you an email with instructions to verify your account. Check your inbox or spam
          folder and follow the instructions.
        </p>
      </section>
      <section class="w-full flex flex-wrap gap-2">
        <p class="text-start">Didn't receive the email?</p>
        <PrimeButton
          label="Resend Email"
          class="p-0"
          link
          @click="resendEmail"
          :disabled="isSubmitDisabled"
        />
        <PrimeBadge
          class="rounded-md animate-fadeIn"
          :value="counter"
          v-if="counter > 0"
        />
      </section>
      <PrimeButton
        label="Return to Sign In"
        @click="goToLogin"
        severity="secondary"
      />
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import PrimeBadge from 'primevue/badge'
  import { useToast } from 'primevue/usetoast'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  const SUBMIT_TIMER = 60

  const props = defineProps({
    resendEmailService: {
      required: true,
      type: Function
    }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const { email } = route.query
  if (!email) {
    router.push({ name: 'login' })
  }

  const validateEmail = (email) => {
    const re = /^\S+@\S+\.\S+$/
    return re.test(email)
  }

  const decodedEmail = decodeURIComponent(email)
  const isEmailValid = ref(validateEmail(decodedEmail))
  if (!isEmailValid.value) {
    toast.add({
      life: 5000,
      severity: 'error',
      detail: 'Use a valid email format.',
      summary: 'Error'
    })
  }

  const resendEmail = async () => {
    disableSubmitByTimer(SUBMIT_TIMER)
    try {
      const res = await props.resendEmailService({ email: decodedEmail })
      toast.add({ life: 5000, severity: 'success', detail: res, summary: 'Email sent!' })
    } catch (err) {
      toast.add({ life: 5000, severity: 'error', detail: err, summary: 'Error sending the email' })
    }
  }

  const isRequested = ref(false)
  const counter = ref(0)
  const countdown = () => counter.value--

  const disableSubmitByTimer = (timeInSec) => {
    isRequested.value = true
    counter.value = timeInSec
    const interval = setInterval(countdown, 1000)
    setTimeout(() => {
      isRequested.value = false
      clearInterval(interval)
    }, timeInSec * 1000)
  }

  const isSubmitDisabled = computed(() => {
    return !isEmailValid.value || isRequested.value
  })

  const goToLogin = () => {
    router.push({ name: 'login' })
  }
</script>
