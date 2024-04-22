<template>
  <p>Loading....</p>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useLoadingStore } from '@/stores/loading'

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

    window.opener.postMessage(data, platformUrl)
    window.parent.close()
  }
</script>
