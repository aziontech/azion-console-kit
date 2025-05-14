<template>
  <PrimeButton
    @click="connectWithGithub"
    label="Connect with GitHub"
    outlined
    icon="pi pi-github"
    iconPos="left"
    :loading="props.loading"
  />
</template>

<script setup>
  import { ref, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import { vcsService } from '@/services/v2'
  const emit = defineEmits(['onCallbackUrl'])

  const props = defineProps({
    loading: {
      type: Boolean,
      required: true
    }
  })

  const githubInstallation = ref('')
  const callbackUrl = ref('')

  const connectWithGithub = async () => {
    const response = await vcsService.listPlatforms()

    response.forEach((platform) => {
      if (platform.id === 'github') {
        githubInstallation.value = platform
        callbackUrl.value = platform.callbackUrl
      }
    })

    openPopupGithub()
  }

  const openPopupGithub = () => {
    const url = githubInstallation.value.installationUrl

    window.open(url, 'page', 'popup=yes, scrollbars=no')
  }

  const emitGithubInstallation = () => {
    emit('onCallbackUrl', callbackUrl)
  }

  watch(callbackUrl, () => {
    emitGithubInstallation()
  })

  defineExpose({
    connectWithGithub
  })
</script>
