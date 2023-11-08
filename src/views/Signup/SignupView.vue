<template>
  <div>
    <SignUpOnlineSalesBlock :signupService="signupService" />
  </div>
</template>

<script setup>
  import SignUpOnlineSalesBlock from '@/templates/signup-block/online-sales.vue'

  defineProps({
    signupService: {
      required: true,
      type: Function
    }
  })
</script>
