<template>
  <div>
    <section class="flex gap-6 xl:gap-0 px-3 surface-section">
      <div class="w-full flex flex-col items-center my-auto">
        <div
          class="card surface-border border rounded-md surface-section p-6 xl:p-8 flex flex-col gap-8 max-w-md"
        >
          <div class="gap-3 flex flex-col">
            <h2 class="text-start text-xl lg:text-2xl font-medium">Sign Up for a Free Account</h2>
            <p class="text-start text-color-secondary">
              US$ 300 credit to use over 12 months, no credit card is required.
            </p>
          </div>

          <SocialIdpsBlock :socialIdpsService="props.listSocialIdpsService" />

          <Divider align="center">
            <p>or</p>
          </Divider>

          <form-signup-block />
        </div>
        <div class="flex flex-wrap justify-center items-center gap-3 mt-8 max-w-md">
          <p class="text-sm font-normal">Already have an account?</p>
          <PrimeButton
            label="Sign In"
            severity="secondary"
            @click="goToLogin"
          />
        </div>
      </div>
      <div class="w-full lg:flex flex-col items-center justify-center">
        <div class="w-full max-w-md lg:justify-end">
          <client-testimonials-block />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import SocialIdpsBlock from '@/templates/social-idps-block'
  import FormSignupBlock from '@/templates/signup-block/form-signup-block.vue'
  import ClientTestimonialsBlock from '@/templates/signup-block/client-testimonials-block.vue'

  const props = defineProps({
    signupService: { required: true, type: Function },
    listSocialIdpsService: { required: true, type: Function }
  })
</script>
