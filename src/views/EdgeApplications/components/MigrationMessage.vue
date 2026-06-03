<template>
  <Message
    v-if="!hasFlagBlockApiV4()"
    severity="info"
    title=""
    closable
    class="mb-4"
  >
    Origins has been redesigned as
    <a
      href="#"
      class="text-[var(--text-color-link)] hover:underline"
      @click="navigateToEdgeConnectors"
      >Connectors</a
    >, and Error Responses are now
    <a
      href="#"
      class="text-[var(--text-color-link)] hover:underline"
      @click="navigateToCustomPages"
      >Custom Pages</a
    >. You can access both features through the main menu.
  </Message>
</template>

<script setup>
  import Message from 'primevue/message'
  import { useRouter } from 'vue-router'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'

  defineOptions({ name: 'MigrationMessage' })

  const router = useRouter()

  const navigateToEdgeConnectors = () => {
    router.push('/connectors')
  }

  const navigateToCustomPages = () => {
    router.push('/custom-pages')
  }
</script>
