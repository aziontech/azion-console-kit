<template>
  <div>
    <div
      class="flex flex-col align-top items-center animate-fadeIn"
      v-if="!emailSended"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 sm:p-8 rounded-md flex-col sm:gap-8 gap-6 inline-flex"
      >
        <div class="flex flex-col gap-3">
          <h3 class="text-xl md:text-2xl font-medium">Reset Password</h3>
          <p class="text-color-secondary">
            Type your email to receive a link to reset your password.
          </p>
        </div>

        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <label
              for="email"
              class="font-semibold text-sm"
              >Email</label
            >
            <InputText
              v-bind="email"
              id="email"
              placeholder="example@email.com"
              type="email"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small
              v-if="errors.email"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.email }}
            </small>
          </div>

          <PrimeButton
            class="w-full flex-row-reverse"
            :loading="isSendingEmailLoading"
            label="Send Email"
            severity="secondary"
            @click="sendEmail()"
            :disabled="!meta.valid"
          />
        </div>
      </div>
    </div>

    <div
      class="flex flex-col align-top items-center animate-fadeIn"
      v-else
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 sm:p-8 rounded-md flex-col sm:gap-8 gap-6 inline-flex"
      >
        <div class="flex flex-col gap-3">
          <h3 class="text-xl md:text-2xl font-medium">Reset Password</h3>
          <p class="text-color-secondary">
            We've sent you an email explaining how to reset your password. Check your inbox or spam
            folder and follow the instructions.
          </p>
        </div>

        <div class="w-full flex flex-wrap gap-2">
          <p class="text-start">Didn't receive the email?</p>
          <PrimeButton
            class="p-0"
            link
            label="Resend Email"
            @click="resendEmail()"
            :disabled="isEmailResent"
          />
          <PrimeBadge
            class="rounded-md animate-fadeIn"
            :value="counter"
            v-if="counter > 0"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import PrimeBadge from 'primevue/badge'

  import * as yup from 'yup'
  import { useForm } from 'vee-validate'
  import { ref } from 'vue'
  import { useToast } from 'primevue/usetoast'

  const SUBMIT_TIMER = 60

  const emailSended = ref(false)
  const isSendingEmailLoading = ref(false)
  const emailValidateRegex = /^\S+@\S+\.\S+$/

  const validationSchema = yup.object({
    email: yup
      .string()
      .required('E-mail is a required field')
      .matches(emailValidateRegex, 'Invalid email address')
  })

  const { defineInputBinds, errors, values, meta } = useForm({
    validationSchema,
    initialValues: {
      email: ''
    }
  })

  const email = defineInputBinds('email', { validateOnInput: true })

  const props = defineProps({
    sendResetPasswordEmailService: {
      type: Function,
      required: true
    }
  })

  const toast = useToast()

  const sendEmail = async () => {
    try {
      isSendingEmailLoading.value = true
      const res = await props.sendResetPasswordEmailService(values)
      toast.add({ severity: 'success', detail: res, summary: 'Email sent' })
      emailSended.value = true
    } catch (err) {
      toast.add({ severity: 'error', detail: err, summary: 'Error' })
    } finally {
      isSendingEmailLoading.value = false
    }
  }

  const resendEmail = async () => {
    disableSubmitByTimer(SUBMIT_TIMER)
    try {
      const res = await props.sendResetPasswordEmailService(values)
      toast.add({ severity: 'success', detail: res, summary: 'Email sent' })
    } catch (err) {
      toast.add({ severity: 'error', detail: err, summary: 'Error' })
    }
  }

  const isEmailResent = ref(false)
  const counter = ref(0)
  const countdown = () => counter.value--

  const disableSubmitByTimer = (timeInSec) => {
    isEmailResent.value = true
    counter.value = timeInSec
    const interval = setInterval(countdown, 1000)
    setTimeout(() => {
      isEmailResent.value = false
      clearInterval(interval)
    }, timeInSec * 1000)
  }

  defineExpose({
    email,
    errors,
    isSendingEmailLoading,
    props,
    sendEmail,
    meta
  })
</script>
