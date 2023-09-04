<template>
  <div class="p-4 w-full">
    <LoginBlock
      :loginService="loginService"
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
      loginService: {
        required: true,
        type: Function
      }
    }
  }
</script>
