<template>
  <div>
    <SignUpOnlineSalesBlock
      :signupService="signupService"
      @signup-success="showSuccess = true"
      v-if="!showSuccess"
    />
    <SignupSuccess
      :resendEmailService="resendEmailService"
      v-else
    />
  </div>
</template>

<script setup>
  import SignUpOnlineSalesBlock from '@/templates/signup-block/online-sales.vue'
  import SignupSuccess from '@/templates/signup-block/signup-success.vue'
  import { ref } from 'vue'

  defineProps({
    signupService: {
      required: true,
      type: Function
    },
    resendEmailService: {
      required: true,
      type: Function
    }
  })

  const showSuccess = ref(true)
</script>
