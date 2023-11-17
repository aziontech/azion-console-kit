<template>
  <ErrorPageBlock
    title="Not Found"
    description="This page doesn't exist yet, usually occurs due to an incorrect or outdated link. Refresh this page and trying again, or you can navigate to a different section of the website."
  >
    <template #illustration>
      <Illustration404 />
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
  import Illustration404 from '@/assets/svg/error-404'
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
