<template>
  <div class="min-h-[calc(100vh-60px-56px)] sm:py-20 pt-4 pb-8 px-3">
    <SignInBlock
      v-if="!showForgotPasswordStep"
      @goToForgotPassword="(value) => (showForgotPasswordStep = value)"
      :authenticationLoginService="authenticationLoginService"
      :verifyLoginService="verifyLoginService"
      :refreshLoginService="refreshLoginService"
      :switchAccountLoginService="switchAccountLoginService"
      :listTypeAccountService="listTypeAccountService"
    />

    <ForgotPassword
      v-if="showForgotPasswordStep"
      :sendResetPasswordEmailService="sendResetPasswordEmailService"
    />
  </div>
</template>

<script>
  import SignInBlock from '@/templates/sign-in-block'
  import ForgotPassword from '@/templates/sign-in-block/forgot-password.vue'
  export default {
    name: 'login-view',
    components: {
      SignInBlock,
      ForgotPassword
    },
    props: {
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
      switchAccountLoginService: {
        required: true,
        type: Function
      },
      sendResetPasswordEmailService: {
        required: true,
        type: Function
      },
      listTypeAccountService: {
        required: true,
        type: Function
      }
    },
    data() {
      return {
        showForgotPasswordStep: false
      }
    }
  }
</script>
