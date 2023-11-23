<template>
  <ErrorPageBlock
    title="Forbidden"
    description="You don't have permission to access this section. If you need access, please contact your administrator."
  >
    <template #illustration>
      <Illustration403 />
    </template>
    <template #actions>
      <PrimeButton
        label="Back to Home"
        @click="handleGoBackHome"
      />
      <PrimeButton
        label="Documentation"
        outlined
        @click="documentationService"
      />
    </template>
  </ErrorPageBlock>
</template>

<script setup>
  import Illustration403 from '@/assets/svg/error-403'
  import PrimeButton from 'primevue/button'
  import ErrorPageBlock from '@/templates/error-page-block'
  import { useRouter } from 'vue-router'
  const router = useRouter()

  defineProps({
    documentationService: { type: Function, required: true }
  })

  function handleGoBackHome() {
    router.push('/')
  }
</script>
