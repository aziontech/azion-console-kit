<template>
  <Message
    v-if="!hasFlagBlockApiV4()"
    severity="info"
    class="mb-4"
    :pt="{
      wrapper: {
        class: 'p-3'
      },
      icon: {
        class: 'w-5 h-5'
      },
      text: {
        class: 'text-sm font-medium'
      }
    }"
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
    <template #closeicon="{ close }">
      <IconButton
        kind="outlined"
        size="medium"
        @click="close()"
        icon="pi pi-times"
        aria-label="button"
      />
    </template>
  </Message>
</template>

<script setup>
  import Message from 'primevue/message'
  import IconButton from '@aziontech/webkit/icon-button'
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
