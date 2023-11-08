<template>
  <section
    class="flex lg:flex-row flex-col gap-6 xl:gap-0 min-h-[calc(100vh-60px-56px)] w-full px-3 py-6 lg:py-20 lg:px-6 surface-section"
  >
    <div class="w-full flex flex-col items-center justify-center">
      <div class="min-w-max">
        <h2 class="text-[32px] sm:text-[48px] lg:text-[56px] leading-10">Welcome to the Edge</h2>
        <div class="flex flex-col gap-3 mt-10">
          <ul
            v-for="(benefit, index) in benefitsList"
            :key="index"
          >
            <li class="text-sm font-normal flex gap-2 items-center text-color-secondary">
              <span class="w-2 h-2 bg-[#d9362b]" />
              {{ benefit }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="w-full flex flex-col justify-center items-center">
      <div class="w-full max-w-md">
        <div
          v-if="!showForm"
          class="card surface-border border rounded-md surface-section p-6 xl:p-10 flex flex-col gap-6 max-w-md"
        >
          <h2 class="text-center lg:text-start text-xl lg:text-2xl font-medium">
            Create your Azion account
          </h2>
          <div class="flex flex-col gap-4">
            <PrimeButton
              label="Continue with Google"
              icon="pi pi-google"
              outlined
            />
            <PrimeButton
              label="Continue with Github"
              icon="pi pi-github"
              outlined
            />
          </div>
          <div class="w-full">
            <Divider
              layout="horizontal"
              align="center"
              >or</Divider
            >
          </div>
          <PrimeButton
            label="Sign Up with E-mail"
            outlined
            @click="showForm = true"
          />
          <p class="text-sm font-normal text-center text-color-secondary">
            By signing up you agree to the
            <PrimeButton
              label="Terms of Service"
              link
              class="p-0 text-sm"
              @click="azionTermsAndServicesWindowOpener"
            />
            and
            <PrimeButton
              label="Privacy Policy."
              link
              class="p-0 text-sm"
              @click="azionPrivacyPolicyWindowOpener"
            />
          </p>
        </div>

        <div
          v-else
          class="card surface-border border rounded-md surface-section p-6 xl:p-10 flex flex-col gap-6 max-w-md"
        >
          <h2 class="text-center lg:text-start text-xl lg:text-2xl font-medium">
            Create your Azion account
          </h2>
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
                :pt="{
                  panel: { class: 'hidden' },
                  meter: (options) => {
                    passwordStrength = options.state.meter?.strength || 'weak'
                  }
                }"
              />
              <small class="p-error text-xs font-normal leading-tight">{{ errors.password }}</small>
            </div>
            <PrimeButton
              label="Next"
              :disabled="!meta.valid"
              type="submit"
            />
          </form>
          <PrimeButton
            label="Other sign up methods"
            outlined
            @click="showForm = false"
          />
          <p class="text-sm font-normal text-center text-color-secondary">
            By signing up you agree to the
            <PrimeButton
              label="Terms of Service"
              link
              class="p-0 text-sm"
              @click="azionTermsAndServicesWindowOpener"
            />
            and
            <PrimeButton
              label="Privacy Policy."
              link
              class="p-0 text-sm"
              @click="azionPrivacyPolicyWindowOpener"
            />
          </p>
        </div>

        <div class="flex flex-wrap justify-center items-center gap-3 mt-6 max-w-md">
          <p class="text-sm font-normal">Already have an account?</p>
          <PrimeButton
            label="Sign in here"
            severity="secondary"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import InputPassword from 'primevue/password'
  import Divider from 'primevue/divider'
  import { onMounted, ref } from 'vue'
  import * as yup from 'yup'
  import { useForm, useField } from 'vee-validate'
  import { load, getInstance } from 'recaptcha-v3'
  import { azionPrivacyPolicyWindowOpener } from '@/helpers/azion-privacy-policy-opener'
  import { azionTermsAndServicesWindowOpener } from '@/helpers/azion-terms-and-services-opener'
  import { useToast } from 'primevue/usetoast'

  let recaptcha
  onMounted(async () => {
    recaptcha = await load(import.meta.env.VITE_RECAPTCHA_SITE_KEY)
  })

  const props = defineProps({
    signupService: { required: true, type: Function }
  })

  const benefitsList = [
    'No credit-card required',
    '$300 in service credits for 12 months',
    'Full access to all products and features',
    'Deploy your first Edge Application in under 5 seconds',
    'Free onboarding session'
  ]

  const showForm = ref(false)
  const passwordStrength = ref('weak')

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
      .test('strength', 'Weak password', () => passwordStrength.value !== 'weak')
  })

  const { values, meta, errors } = useForm({ validationSchema })

  const { value: name } = useField('name')
  const { value: email } = useField('email')
  const { value: password } = useField('password')

  const toast = useToast()

  const emit = defineEmits(['signup-success'])
  const signUp = async () => {
    try {
      const captcha = await recaptcha.execute('signup')
      await props.signupService({ ...values, captcha })
      emit('signup-success')
      getInstance().hideBadge()
    } catch (err) {
      toast.add({ life: 5000, severity: 'error', detail: err, summary: 'Error' })
    }
  }
</script>
