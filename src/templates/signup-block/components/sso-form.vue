<template>
  <div class="w-full flex flex-col gap-6">
    <form
      class="flex flex-col gap-6"
      @submit.prevent="signUp"
    >
      <div class="flex flex-col gap-2">
        <label
          for="name"
          class="font-semibold text-sm"
          >Full name</label
        >
        <InputText
          v-model="name"
          id="name"
          placeholder="Type your full name"
          type="text"
          class="w-full"
          :class="{ 'p-invalid': errors.name }"
        />
        <small
          v-if="errors.name"
          class="p-error text-xs font-normal leading-tight"
          >{{ errors.name }}</small
        >
      </div>
      <div class="flex flex-col gap-2">
        <label
          for="email"
          class="font-semibold text-sm"
          >E-mail</label
        >
        <InputText
          v-model="email"
          id="email"
          placeholder="Type your e-mail"
          type="email"
          class="w-full"
          :class="{ 'p-invalid': errors.email }"
        />
        <small
          v-if="errors.email"
          class="p-error text-xs font-normal leading-tight"
          >{{ errors.email }}</small
        >
      </div>
      <div class="flex flex-col gap-2">
        <label
          for="password"
          class="font-semibold text-sm"
          >Password</label
        >
        <InputPassword
          toggleMask
          v-model="password"
          id="password"
          class="w-full"
          placeholder="Type your password"
          :class="{ 'p-invalid': errors.password }"
          :feedback="false"
        />
        <small class="p-error text-xs font-normal leading-tight">{{ errors.password }}</small>
        <ul class="text-color-secondary list-inside space-y-3">
          <li
            class="flex gap-3 items-center text-color-secondary"
            :key="i"
            v-for="(requirement, i) in passwordRequirementsList"
          >
            <div class="w-3">
              <span
                class="w-2 h-2 bg-[#F3652B] animate-fadeIn"
                v-if="!requirement.valid"
              />
              <span
                class="pi pi-check text-sm text-[#22C55E] animate-fadeIn"
                v-else
              />
            </div>
            <span>{{ requirement.label }}</span>
          </li>
        </ul>
      </div>
      <PrimeButton
        label="Next"
        :disabled="!meta.valid"
        type="submit"
        severity="secondary"
        :loading="loading"
      />
    </form>
    <PrimeButton
      label="Other sign up methods"
      outlined
      @click="$emit('show-form')"
    />
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref } from 'vue'
  import * as yup from 'yup'
  import { useForm, useField } from 'vee-validate'
  import { load, getInstance } from 'recaptcha-v3'
  import { useToast } from 'primevue/usetoast'
  import { useRouter } from 'vue-router'
  import InputText from 'primevue/inputtext'
  import InputPassword from 'primevue/password'
  import PrimeButton from 'primevue/button'

  defineEmits(['show-form'])

  const props = defineProps({
    signupService: { required: true, type: Function }
  })

  let recaptcha
  onMounted(async () => {
    recaptcha = await load(import.meta.env.VITE_RECAPTCHA_SITE_KEY)
    getInstance().showBadge()
  })

  const passwordRequirementsList = ref([
    { label: '> 7 characters', valid: false },
    { label: 'Uppercase letter', valid: false },
    { label: 'Lowercase letter', valid: false },
    { label: 'Special character (e.g. !?<>@#$%)', valid: false }
  ])

  const validationSchema = yup.object({
    name: yup
      .string()
      .max(61, 'Exceeded number of characters')
      .test('invalidChars', 'Name contains invalid characters', (value) => {
        return !value?.match(/[><:/\\"&@]/g)
      })
      .test('invalidContent', 'Name contains invalid content (URL)', (value) => {
        return !value?.match(/[a-z\d_-]+\.[a-z\d_-]+/gi)
      })
      .required('Full Name is a required field'),
    email: yup
      .string()
      .max(254, 'Exceeded number of characters')
      .email('Please enter a valid e-mail')
      .required('E-mail is a required field'),
    password: yup
      .string()
      .test('max', 'Exceeded number of characters', (value) => value?.length <= 128)
      .test('min', 'Password is a required field', (value) => !!value)
      .test('requirements', '', (value) => {
        const hasUpperCase = value && /[A-Z]/.test(value)
        const hasLowerCase = value && /[a-z]/.test(value)
        const hasSpecialChar = value && /[!@#$%^&*(),.?":{}|<>]/.test(value)
        const hasMinLength = value?.length > 7
        passwordRequirementsList.value[0].valid = hasMinLength
        passwordRequirementsList.value[1].valid = hasUpperCase
        passwordRequirementsList.value[2].valid = hasLowerCase
        passwordRequirementsList.value[3].valid = hasSpecialChar
        return hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar
      })
  })

  const { values, meta, errors } = useForm({ validationSchema })

  const { value: name } = useField('name')
  const { value: email } = useField('email')
  const { value: password } = useField('password')

  const toast = useToast()
  const router = useRouter()

  const loading = ref(false)

  const signUp = async () => {
    loading.value = true
    try {
      const captcha = await recaptcha.execute('signup')
      await props.signupService({ ...values, captcha })
      router.push({ name: 'activation', query: { email: values.email } })
    } catch (err) {
      toast.add({ life: 5000, severity: 'error', detail: err, summary: 'Error' })
    } finally {
      loading.value = false
    }
  }

  onUnmounted(() => {
    getInstance().hideBadge()
  })
</script>
