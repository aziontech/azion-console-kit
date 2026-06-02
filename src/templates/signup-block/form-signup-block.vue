<template>
  <div class="max-w-md md:min-w-[448px]">
    <div v-if="showActivation">
      <div class="flex surface-border border rounded-md p-6">
        <div class="w-full flex flex-col gap-8 animate-fadeIn">
          <form
            class="flex flex-col gap-8"
            autocomplete="off"
            @submit.prevent
          >
            <div class="gap-2 flex flex-col">
              <h1 class="text-start text-xl lg:text-2xl font-medium">{{ signupHeading }}</h1>
            </div>

            <div>
              <SocialIdpsBlock v-model:showSocialIdps="showLoginFromEmail" />

              <PrimeDivider
                class="my-3"
                align="center"
                v-if="showLoginFromEmail"
              >
                <p>or</p>
              </PrimeDivider>

              <div class="flex flex-col gap-8">
                <LoginWithEmailBlock
                  :showLoginFromEmail="showLoginFromEmail"
                  :signupService="props.signupService"
                  @loginWithEmail="showActivationEmail"
                />
              </div>
            </div>

            <p class="text-sm font-normal text-center text-color-secondary">
              By signing up, you agree to the
              <Button
                kind="text"
                label="Terms of Service"
                size="medium"
                @click="azionTermsAndServicesWindowOpener"
                class="p-0"
              />
              and
              <Button
                kind="text"
                label="Privacy Policy."
                size="medium"
                @click="azionPrivacyPolicyWindowOpener"
                class="p-0"
              />
            </p>
          </form>
        </div>
      </div>
      <div class="flex flex-wrap justify-center items-center gap-1 mt-8">
        <p class="text-sm font-normal">Already have an account?</p>
        <Button
          kind="text"
          label="Sign In"
          size="small"
          @click="goToLogin"
          class="p-0"
        />
      </div>
    </div>
    <AccountActivation
      v-else
      :resendEmailService="props.resendEmailService"
    />
  </div>
</template>

<script setup>
  import { azionPrivacyPolicyWindowOpener, azionTermsAndServicesWindowOpener } from '@/helpers'
  import SocialIdpsBlock from '@/templates/social-idps-block'
  import AccountActivation from '@/templates/signup-block/account-activation.vue'
  import Button from '@aziontech/webkit/button'
  import PrimeDivider from '@aziontech/webkit/divider'
  import LoginWithEmailBlock from '@/templates/signup-block/login-with-email-block'
  import { usePlans } from '@/composables/usePlans'
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    signupService: { required: true, type: Function },
    resendEmailService: { required: true, type: Function }
  })

  const router = useRouter()
  const { plan, initialize: initializePlans } = usePlans()
  initializePlans({ defaultPlan: 'hobby' })

  const showLoginFromEmail = ref(true)
  const showActivation = ref(true)

  const signupHeading = computed(() =>
    plan.value === 'pro' ? 'Sign Up for the Pro Plan' : 'Sign Up for a Free Account'
  )

  const showActivationEmail = () => {
    showActivation.value = false
  }

  const goToLogin = () => {
    router.push({ name: 'login' })
  }
</script>
