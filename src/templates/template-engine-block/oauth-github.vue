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
  import { vcsService } from '@/services/v2/vcs/vcs-service'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()

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
    try {
      const response = await vcsService.listPlatforms()

      response.forEach((platform) => {
        if (platform.id === 'github') {
          githubInstallation.value = platform
          callbackUrl.value = platform.callbackUrl
        }
      })

      openPopupGithub()
    } catch (error) {
      error.showErrors(toast)
    }
  }

  const openPopupGithub = () => {
    const url = githubInstallation.value.installationUrl

    window.open(url, 'page', 'popup=yes, scrollbars=no')
  }

  const emitGithubInstallation = () => {
    emit('onCallbackUrl', callbackUrl.value)
  }

  watch(callbackUrl, () => {
    emitGithubInstallation()
  })

  defineExpose({
    connectWithGithub
  })
</script>
