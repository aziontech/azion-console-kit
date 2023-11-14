<template>
  <div>
    <section class="flex gap-6 xl:gap-0 px-3 surface-section h-[calc(100vh-60px-56px)]">
      <div class="w-full hidden lg:flex flex-col items-center justify-center">
        <div class="w-full max-w-md lg:justify-end">
          <h2 class="text-4xl xl:text-6xl font-normal leading-10">{{ pageTitle }}</h2>
          <div class="flex flex-col gap-3 mt-10">
            <ul
              v-for="(benefit, index) in benefitsList"
              :key="index"
            >
              <li class="text-sm font-normal flex gap-2 items-center text-color-secondary">
                <span class="w-2 h-2 bg-orange-bullet" />
                {{ benefit }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div
        class="w-full flex flex-col justify-start items-center pt-10 pb-20 overflow-y-auto max-h-[calc(100vh-60px-56px-2rem)]"
      >
        <div
          class="card surface-border border rounded-md surface-section p-6 xl:p-10 flex flex-col gap-6 max-w-md"
        >
          <h2 class="text-center lg:text-start text-xl lg:text-2xl font-medium">
            {{ formTitle }}
          </h2>
          <slot name="form" />
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
    </section>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import { azionPrivacyPolicyWindowOpener } from '@/helpers/azion-privacy-policy-opener'
  import { azionTermsAndServicesWindowOpener } from '@/helpers/azion-terms-and-services-opener'

  defineOptions({
    name: 'page-with-form-block'
  })

  defineProps({
    pageTitle: {
      type: String,
      required: true
    },
    benefitsList: {
      type: Array,
      required: true
    },
    formTitle: {
      type: String,
      required: true
    }
  })
</script>
