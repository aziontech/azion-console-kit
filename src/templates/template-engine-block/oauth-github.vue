<template>
  <PrimeButton
    @click="connectWithGithub"
    label="Connect with GitHub"
    outlined
    icon="pi pi-github"
    iconPos="left"
    :loading="loading"
  />
</template>

<script setup>
  import { ref, watch } from 'vue'
  import PrimeButton from 'primevue/button'

  const emit = defineEmits(['onCallbackUrl'])

  const props = defineProps({
    listPlatformsService: {
      type: Function,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    }
  })

  const githubInstallation = ref('')
  const callbackUrl = ref('')

  const connectWithGithub = async () => {
    const response = await props.listPlatformsService()

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

    window.open(url, 'page', 'width=640, height=700, top=100, left=110, popup=yes, scrollbars=no')
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
