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
  import PrimeButton from 'primevue/button'
  import Skeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { computed, onMounted, ref, inject, onUnmounted } from 'vue'

  defineOptions({ name: 'social-idps-block' })
  const emit = defineEmits(['showSocialIdps'])

  const tracker = inject('tracker')

  const props = defineProps({
    socialIdpsService: {
      type: Function,
      required: true
    }
  })

  const idps = ref([])
  const submittedIdp = ref(null)

  const showSkeleton = computed(() => idps.value.length === 0)

  onMounted(() => {
    window.addEventListener('pageshow', resetLoadingState)
    loadSocialIdps()
  })

  const toast = useToast()
  const showIdps = ref(true)
  const loadSocialIdps = async () => {
    try {
      idps.value = await props.socialIdpsService()
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      showIdps.value = idps.value.length > 0
      emit('showSocialIdps', showIdps.value)
    }
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

    accountStore.setSsoSignUpMethod(idp.slug)
    window.location.href = idp.loginUrl
    tracker.signUp.userClickedSignedUp({ method: idp.slug }).track()
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
