<template>
  <AccountSettingsBlock :accountSettingsService="accountSettingsService" />
</template>

<script setup>
  import AccountSettingsBlock from '@/templates/account-settings-block'

  defineProps({
    accountSettingsService: {
      type: Function,
      required: false
    }
  })
</script>
