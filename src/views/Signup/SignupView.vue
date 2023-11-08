<template>
  <div class="min-h-[calc(100vh-60px-56px)] w-full px-3 py-6 lg:py-20 lg:px-6 surface-section">
    <SignUpOnlineSalesBlock
      :signupService="signupService"
      @signup-success="showSuccess = true"
      v-if="!showSuccess"
    />
    <SignupSuccess v-else />
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
    }
  })

  const showSuccess = ref(true)
</script>
