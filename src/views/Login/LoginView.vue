<template>
  <div class="min-h-[calc(100vh-60px-56px)] sm:py-20 pt-4 pb-8 px-3">
    <SignInBlock
      v-if="!showForgotPasswordStep"
      @goToForgotPassword="(value) => (showForgotPasswordStep = value)"
      :authenticationLoginService="props.authenticationLoginService"
      :verifyLoginService="props.verifyLoginService"
      :refreshLoginService="props.refreshLoginService"
      :accountHandler="props.accountHandler"
      :listSocialIdpsService="props.listSocialIdpsService"
    />

    <ForgotPassword
      v-if="showForgotPasswordStep"
      :sendResetPasswordEmailService="props.sendResetPasswordEmailService"
    />
  </div>
</template>

<script setup>
  import { onMounted, ref, inject } from 'vue'
  import SignInBlock from '@/templates/sign-in-block'
  import ForgotPassword from '@/templates/sign-in-block/forgot-password.vue'
  import { useRoute, useRouter } from 'vue-router'
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
    },
    listSocialIdpsService: {
      required: true,
      type: Function
    }
  })

  const showForgotPasswordStep = ref(false)

  onMounted(() => {
    const { email, activated } = route.query
    const isActivatedEmail = !!email && !activated

    if (isActivatedEmail) {
      tracker.signUp.userActivatedAccount()
      tracker.signUp.userSignedUp({ method: 'email' }).track()

      const newQuery = { ...route.query, activated: 'true' }
      router.replace({ query: newQuery })
    }
  })
</script>
