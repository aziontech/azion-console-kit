<template>
  <div>
    <div
      class="flex flex-col align-top items-center p-4 animate-fadeIn"
      v-if="!emailSended"
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-10 inline-flex"
      >
        <div class="flex flex-col gap-3">
          <div class="text-xl md:text-2xl font-medium">Reset Password</div>
          <p class="text-color-secondary">
            Type your email to receive a link to reset your password.
          </p>
        </div>

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
            v-tooltip.top="{ value: errors.email, showDelay: 200 }"
          />
        </div>

        <PrimeButton
          class="w-full flex-row-reverse"
          :loading="isSendingEmailLoading"
          label="Send Email"
          severity="primary"
          @click="sendEmail()"
          :disabled="!meta.valid"
        />
      </div>
    </div>

    <div
      class="flex flex-col align-top items-center p-4 animate-fadeIn"
      v-else
    >
      <div
        class="surface-card surface-border border max-w-md w-full p-6 md:p-10 rounded-md flex-col gap-8 inline-flex"
      >
        <div class="flex flex-col gap-3">
          <div class="text-xl md:text-2xl font-medium">Reset Password</div>
          <p class="text-color-secondary">
            We've sent you an email explaining how to reset your password. Check your inbox or spam folder and follow the instructions.
          </p>
        </div>

        <div class="flex flex-wrap items-center">
          <div>Didn't receive the email?</div>
          <PrimeButton
            link
            label="Resend Email"
            @click="sendEmail()"
          ></PrimeButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'

  import * as yup from 'yup'
  import { useForm } from 'vee-validate'
  import { ref } from 'vue'

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

  const sendEmail = async () => {
    try {
      isSendingEmailLoading.value = true
      await props.sendResetPasswordEmailService(values)
      emailSended.value = true
    } finally {
      isSendingEmailLoading.value = false
    }
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
