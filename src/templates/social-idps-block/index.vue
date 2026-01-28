<template>
  <div
    class="flex-col gap-6 sm:gap-8 flex"
    v-if="showIdps"
  >
    <div class="flex flex-col gap-4 animate-fadeIn">
      <template v-if="showSkeleton">
        <Skeleton
          v-for="item in 3"
          :key="item"
          class="w-full h-9"
        />
      </template>
      <template
        v-else
        v-for="idp in idps"
        :key="idp.slug"
      >
        <PrimeButton
          v-if="idp.isActive"
          :label="formatName(idp.name)"
          :icon="getIcon(idp.slug)"
          @click="authenticate(idp)"
          outlined
          :loading="submittedIdp === idp.uuid"
          :disabled="submittedIdp"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
  import { useAccountStore } from '@/stores/account'
  import { useLoadingStore } from '@/stores/loading'
  import { validateOAuthRedirect } from '@/helpers/oauth-security'
  import PrimeButton from 'primevue/button'
  import Skeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { computed, onMounted, ref, inject, onUnmounted, defineModel } from 'vue'
  import socialIdpsData from '@/helpers/social-idps'

  defineOptions({ name: 'social-idps-block' })

  const tracker = inject('tracker')

  const idps = ref([])
  const submittedIdp = ref(null)

  const showSkeleton = computed(() => idps.value.length === 0)

  onMounted(() => {
    window.addEventListener('pageshow', resetLoadingState)
    loadSocialIdps()
  })

  const toast = useToast()
  const showIdps = defineModel('showSocialIdps')

  const loadSocialIdps = () => {
    idps.value = socialIdpsData
    showIdps.value = idps.value.length > 0
  }

  const formatName = (name) => {
    return `Continue with ${name}`
  }

  const getIcon = (slug) => {
    const icons = {
      google: 'pi pi-google',
      github: 'pi pi-github',
      azure: 'pi pi-microsoft'
    }

    return icons[slug]
  }

  const loadingStore = useLoadingStore()
  const accountStore = useAccountStore()

  const authenticate = (idp) => {
    submittedIdp.value = idp.uuid

    loadingStore.startLoading()

    if (validateOAuthRedirect(idp.loginUrl)) {
      accountStore.setSsoSignUpMethod(idp.slug)
      window.location.assign(idp.loginUrl)
      tracker.signUp.userClickedSignedUp({ method: idp.slug }).track()
    } else {
      loadingStore.finishLoading()
      submittedIdp.value = null
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Invalid OAuth URL detected'
      })
    }
  }

  /*
    When user goes to social login page and then goes back, the login page is cached in the browser.
    https://web.dev/articles/bfcache
  */
  const resetLoadingState = () => {
    loadingStore.finishLoading()
    submittedIdp.value = null
  }

  onUnmounted(() => {
    window.removeEventListener('pageshow', resetLoadingState)
  })
</script>
