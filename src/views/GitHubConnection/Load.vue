<template>
</template>
<script setup>
  import { onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useLoadingStore } from '@/stores/loading'

  const route = useRoute()
  const loading = useLoadingStore()

  onMounted(async () =>{
    loading.startLoading()
    const platformUrl = 'http://localhost:5173'
    window.opener.postMessage(route.query , platformUrl)
    window.parent.close()
  })
</script>