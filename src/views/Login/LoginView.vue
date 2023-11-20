<template>
  <div>
    <SignInBlock
      v-if="!showForgotPasswordStep"
      @goToForgotPassword="(value) => (showForgotPasswordStep = value)"
      :authenticationLoginService="authenticationLoginService"
      :verifyLoginService="verifyLoginService"
      :refreshLoginService="refreshLoginService"
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
      sendResetPasswordEmailService: {
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
