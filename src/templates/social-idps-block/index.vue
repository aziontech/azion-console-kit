<template>
  <div
    class="flex-col gap-6 sm:gap-8 flex"
    v-if="showSocialIdps"
  >
    <Divider
      align="center"
      v-if="direction === 'top-to-bottom'"
    >
      <p>or</p>
    </Divider>
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
    <Divider
      align="center"
      v-if="direction === 'bottom-to-top'"
    >
      <p>or</p>
    </Divider>
  </div>
</template>

<script setup>
  import { useAccountStore } from '@/stores/account'
  import { useLoadingStore } from '@/stores/loading'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import Skeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { computed, onMounted, ref } from 'vue'

  defineOptions({ name: 'social-idps-block' })

  const props = defineProps({
    socialIdpsService: {
      type: Function,
      required: true
    },
    direction: {
      type: String,
      required: true,
      validator: (value) => {
        return ['top-to-bottom', 'bottom-to-top'].includes(value)
      }
    }
  })

  const idps = ref([])
  const showSocialIdps = ref(true)
  const submittedIdp = ref(null)

  const showSkeleton = computed(() => idps.value.length === 0)

  onMounted(() => {
    loadSocialIdps()
  })

  const toast = useToast()

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
      if (idps.value.length === 0) {
        showSocialIdps.value = false
      }
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
  }
</script>
