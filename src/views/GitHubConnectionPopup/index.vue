<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-section px-4">
    <div
      class="w-full max-w-md rounded-lg border surface-border bg-surface-card shadow-sm p-6 flex flex-col items-center gap-6"
    >
      <div class="flex items-center gap-4">
        <!-- Azion icon placeholder -->
        <div
          class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg"
        >
          <AzionLogo />
        </div>

        <!-- Sync indicator -->
        <div class="flex flex-col items-center justify-center gap-1">
          <div class="flex items-center gap-2 text-sm text-muted-color">
            <span
              class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              :style="{ 'animation-delay': '0s' }"
            ></span>

            <span
              class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              :style="{ 'animation-delay': '0.5s' }"
            ></span>

            <span
              class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              :style="{ 'animation-delay': '1s' }"
            ></span>
          </div>
        </div>

        <!-- GitHub icon placeholder -->
        <div
          class="h-12 w-12 rounded-full bg-surface border flex items-center justify-center text-foreground text-xl"
        >
          <span class="pi pi-github"></span>
        </div>
      </div>

      <div class="text-center space-y-2">
        <h1 class="text-base font-medium text-foreground">Conectando com o GitHub</h1>
        <p class="text-sm text-muted-color leading-relaxed max-w-sm">
          Sincronizando sua conta do GitHub com a plataforma Azion...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useLoadingStore } from '@/stores/loading'
  import AzionLogo from '@assets/svg/logo'

  const route = useRoute()
  const loading = useLoadingStore()

  defineOptions({ name: 'github-connection-popup' })

  onMounted(() => {
    loading.startLoading()
    sendPostMessage()
  })

  const sendPostMessage = () => {
    const platformUrl = window.location.origin
    const data = {
      event: 'integration-data',
      data: route.query
    }
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(data, platformUrl)
    }

    window.parent.close()
  }
</script>
