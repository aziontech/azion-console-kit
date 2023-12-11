<template>
  <div>Hello from account-settings-block</div>
</template>

<script setup>
  defineOptions({ name: 'account-settings-block' })

  defineProps({
    accountSettingsService: {
      type: Function,
      required: false
    }
  })
</script>
