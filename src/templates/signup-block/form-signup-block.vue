<template>
  <div class="w-auto md:max-w-md">
    <div v-if="showActivation">
      <div class="flex surface-border border rounded-md p-6">
        <div class="w-full flex flex-col gap-8 animate-fadeIn">
          <form
            class="flex flex-col gap-8"
            autocomplete="off"
            @submit.prevent
          >
            <div class="gap-3 flex flex-col">
              <h2 class="text-start text-xl lg:text-2xl font-medium">Sign Up for a Free Account</h2>
              <p class="text-start text-color-secondary">
                US$ 300 credit to use over 12 months, no credit card is required.
              </p>
            </div>

            <div>
              <SocialIdpsBlock
                :socialIdpsService="props.listSocialIdpsService"
                @showSocialIdps="updateEmailForm"
                v-if="showLoginFromEmail"
              />

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
                  @loginWithEmail="showActivation = false"
                />
              </div>
            </div>

            <p class="text-sm font-normal text-center text-color-secondary">
              By signing up, you agree to the
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
          </form>
        </div>
      </div>
      <div class="flex flex-wrap justify-center items-center gap-3 mt-8">
        <p class="text-sm font-normal">Already have an account?</p>
        <PrimeButton
          label="Sign In"
          severity="secondary"
          @click="goToLogin"
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
  import PrimeButton from 'primevue/button'
  import PrimeDivider from 'primevue/divider'
  import LoginWithEmailBlock from '@/templates/signup-block/login-with-email-block'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    signupService: { required: true, type: Function },
    listSocialIdpsService: { required: true, type: Function },
    resendEmailService: { required: true, type: Function }
  })

  const router = useRouter()
  const showLoginFromEmail = ref(true)
  const showActivation = ref(true)

  const updateEmailForm = (value) => {
    showLoginFromEmail.value = value
  }

  const goToLogin = () => {
    router.push({ name: 'login' })
  }
</script>
