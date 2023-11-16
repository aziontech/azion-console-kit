<template>
  <div class="align-items-center min-h-[calc(100vh-60px-56px)] w-full py-40 px-6">
    <div
      class="card surface-border border rounded-md surface-section p-10 flex flex-col gap-8 max-w-md"
    >
      <section class="w-full flex flex-col gap-3">
        <h2 class="text-start text-xl font-medium">Check your e-mail to activate your account</h2>
        <p class="text-start text-color-secondary">
          Verify your account by clicking the link in the confirmation email we just sent you.
        </p>
      </section>
      <section class="w-full flex gap-2">
        <p class="text-start">Didn't receive the email?</p>
        <PrimeButton
          label="Resend email"
          class="p-0"
          link
          @click="resendEmail"
          :disabled="!isEmailValid"
        />
      </section>
      <PrimeButton
        label="Return to our website"
        @click="$router.push({ name: 'login' })"
        severity="secondary"
      />
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

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
    const re = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.\S+$/
    return re.test(email)
  }

  const decodedEmail = decodeURIComponent(email)
  const isEmailValid = ref(validateEmail(decodedEmail))
  if (!isEmailValid.value) {
    toast.add({ life: 5000, severity: 'error', detail: 'Invalid email format', summary: 'Error' })
  }

  const resendEmail = async () => {
    try {
      const res = await props.resendEmailService({ email: decodedEmail })
      toast.add({ life: 5000, severity: 'success', detail: res, summary: 'Email sent' })
    } catch (err) {
      toast.add({ life: 5000, severity: 'error', detail: err, summary: 'Error' })
    }
  }
</script>
