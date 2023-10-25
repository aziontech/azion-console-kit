<template>
  <SignInBlock
    :authenticationLoginService="authenticationLoginService"
    :verifyLoginService="verifyLoginService"
    :refreshLoginService="refreshLoginService"
    :switchAccountLoginService="switchAccountLoginService"
  ></SignInBlock>
</template>
<script>
  import SignInBlock from '@/templates/sign-in-block'
  export default {
    name: 'login-view',
    components: {
      SignInBlock
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
      }
    }
  }
</script>
