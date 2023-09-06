<template>
  <div class="p-4 w-full">
    <LoginBlock
      :authenticationLoginService="authenticationLoginService"
      :verifyLoginService="verifyLoginService"
      :refreshLoginService="refreshLoginService"
      test="dd"
    />
  </div>
</template>
<script>
import LoginBlock from '@/templates/login-block'
export default {
  name: 'login-view',
  components: {
    LoginBlock
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
  }
}
</script>
