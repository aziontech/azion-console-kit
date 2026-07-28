<template>
  <LegacyAdditionalDataView
    v-if="isManagedBillingAccount"
    :postAdditionalDataService="props.postAdditionalDataService"
    :patchFullnameService="props.patchFullnameService"
    :updateAccountInfoService="props.updateAccountInfoService"
  />
  <AdditionalDataView v-else />
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { useAccountStore } from '@/stores/account'
  import AdditionalDataView from '@/views/Signup/AdditionalDataView.vue'
  import LegacyAdditionalDataView from '@/views/Signup/legacy/LegacyAdditionalDataView.vue'

  defineOptions({ name: 'OnboardingScreen' })

  const props = defineProps({
    postAdditionalDataService: { type: Function, required: true },
    patchFullnameService: { type: Function, required: true },
    updateAccountInfoService: { type: Function, required: true }
  })

  const accountStore = useAccountStore()
  const { isManagedBillingAccount } = storeToRefs(accountStore)
</script>
