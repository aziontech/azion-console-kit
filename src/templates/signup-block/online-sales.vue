<template>
  <section
    class="flex gap-6 xl:gap-0 px-3 py-6 lg:py-20 lg:px-6 surface-section min-h-[calc(100vh-60px-56px)]"
  >
    <div class="w-full hidden lg:flex flex-col items-center xl:justify-center">
      <div class="w-full max-w-md lg:justify-end">
        <h2 class="text-4xl xl:text-6xl font-normal leading-10">Welcome to the Edge</h2>
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
          class="card surface-border border rounded-md surface-section p-6 xl:p-10 flex flex-col gap-6 max-w-md"
        >
          <h2 class="text-center lg:text-start text-xl lg:text-2xl font-medium">
            Create your Azion account
          </h2>
          <SocialSignup
            @show-form="showForm = true"
            v-if="!showForm"
          />
          <SsoSignup
            @show-form="showForm = false"
            :signupService="signupService"
            v-else
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
            @click="$router.push({ name: 'login' })"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import { ref } from 'vue'
  import { azionPrivacyPolicyWindowOpener } from '@/helpers/azion-privacy-policy-opener'
  import { azionTermsAndServicesWindowOpener } from '@/helpers/azion-terms-and-services-opener'
  import SocialSignup from './components/social-signup'
  import SsoSignup from './components/sso-form'

  defineProps({
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
</script>
