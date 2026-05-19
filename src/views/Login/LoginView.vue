<template>
  <div class="flex flex-col sm:py-20 pt-4 pb-8 px-3 h-full justify-center items-center">
    <SignInBlock
      v-if="!showForgotPasswordStep"
      @goToForgotPassword="(value) => (showForgotPasswordStep = value)"
      :authenticationLoginService="props.authenticationLoginService"
      :verifyLoginService="props.verifyLoginService"
      :refreshLoginService="props.refreshLoginService"
      :accountHandler="props.accountHandler"
    />

    <ForgotPassword
      v-if="showForgotPasswordStep"
      @goToSignIn="showForgotPasswordStep = false"
      :sendResetPasswordEmailService="props.sendResetPasswordEmailService"
    />
  </div>
</template>

<script setup>
  import { onMounted, ref, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import SignInBlock from '@/templates/sign-in-block'
  import ForgotPassword from '@/templates/sign-in-block/forgot-password.vue'
  import { sessionManager } from '@/services/v2/base/auth'
  import { useAccountStore } from '@/stores/account'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const route = useRoute()
  const router = useRouter()

  const props = defineProps({
    authenticationLoginService: {
      required: true,
      type: Function
    },
    verifyLoginService: {
      required: true,
      type: Function
    },
    refreshLoginService: {
      required: true,
      type: Function
    },
    sendResetPasswordEmailService: {
      required: true,
      type: Function
    },
    accountHandler: {
      required: true,
      type: Object
    }
  })

  const showForgotPasswordStep = ref(false)

  onMounted(async () => {
    if (useAccountStore().hasSession) {
      window.location.assign('/')
      return
    }

    await sessionManager.logout()
    const { email, activated } = route.query
    const isActivatedEmail = !!email && !activated

    if (isActivatedEmail) {
      // Set signup_email flag for tracking when user completes email signup
      const accountStore = useAccountStore()
      accountStore.setSignupTypeFlag('signup_email')

      tracker.signUp.userActivatedAccount().track()

      const newQuery = { ...route.query, activated: 'true' }
      router.replace({ query: newQuery })
    }
  })
</script>
