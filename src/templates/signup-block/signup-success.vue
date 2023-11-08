<template>
  <div class="flex justify-center min-h-[calc(100vh-60px-56px)] w-full py-40 px-6">
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
        <p class="text-start text-color-secondary">Didn't receive the email?</p>
        <PrimeButton
          label="Resend email"
          class="p-0 text-sm"
          link
          @click="resendEmail"
        />
      </section>
      <PrimeButton
        label="Return to our website"
        @click="$router.push({ name: 'login' })"
      />
    </div>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    resendEmailService: {
      required: true,
      type: Function
    }
  })

  const toast = useToast()

  const resendEmail = async () => {
    try {
      await props.resendEmailService()
      toast.add({ life: 5000, severity: 'success', detail: 'Email sent', summary: 'Email sent' })
    } catch (err) {
      toast.add({ life: 5000, severity: 'error', detail: err, summary: 'Error' })
    }
  }
</script>
