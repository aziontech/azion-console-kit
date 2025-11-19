<template>
  <PrimeButton
    @click="openCreateModalToggle()"
    icon="pi pi-plus"
    :label="currentLabel"
    class="h-8 w-8 md:w-fit text-white border-header"
    size="small"
    :pt="{
      label: { class: 'text-white' },
      icon: { class: 'text-white' }
    }"
    :class="{
      'bg-header hover:bg-header-button-hover': !createModalIsOpen,
      'bg-header-button-enabled': createModalIsOpen
    }"
    v-tooltip.bottom="{ value: 'Create', showDelay: 200 }"
  />

  <PrimeDialog
    :draggable="false"
    v-model:visible="createModalIsOpen"
    modal
    header="New"
    :pt="{
      root: { class: 'hidden w-full max-w-screen-2xl h-screen sm:flex' },
      content: { class: 'h-full' },
      mask: { class: 'hidden sm:flex' }
    }"
    position="center"
    :dismissableMask="true"
    @update:visible="closeCreateModalStore()"
  >
    <div>
      <MakeCreateModalBlock
        v-if="!isMobile"
        :solutions="solutions"
        :loading="loading"
        @closeModal="closeCreateModalStore()"
      />
    </div>
  </PrimeDialog>

  <Sidebar
    v-model:visible="createModalIsOpen"
    position="bottom"
    headerContent="Create something new"
    :show-close-icon="false"
    :pt="{
      root: { class: 'h-[80%] flex p-0 sm:hidden' },
      headerContent: { class: 'w-full' },
      mask: { class: 'flex sm:hidden' }
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <h2>Create</h2>
        <div class="flex gap-2">
          <ConsoleFeedback />
          <PrimeButton
            icon="pi pi-times"
            @click="closeCreateModalStore()"
            size="small"
            class="flex-none surface-border text-sm w-8 h-8"
            text
            aria-label="Close create modal"
          />
        </div>
      </div>
    </template>
    <MakeCreateModalBlock
      v-if="isMobile"
      :solutions="solutions"
      :loading="loading"
      @closeModal="closeCreateModalStore()"
    />
  </Sidebar>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { useCreateModalStore } from '@/stores/create-modal'
  import { useRoute } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import { useListSolutions } from '@/services/v2/marketplace/queries'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'
  import { useToast } from 'primevue/usetoast'

  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import Sidebar from 'primevue/sidebar'
  import MakeCreateModalBlock from '@/templates/create-modal-block/make-create-modal-block.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'navbar-create-block' })

  const route = useRoute()
  const createModalStore = useCreateModalStore()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768
  const SCREEN_BREAKPOINT_SM = 640

  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)
  const toast = useToast()


  const {
    data: recommendedData,
    isLoading: recommendedLoading
  } = useListSolutions(
    computed(() => ({
      group: 'recommended',
      type: hasFlagBlockApiV4()
        ? accountData.value.jobRole
        : `${accountData.value.jobRole}-v4`
    }))
  )


  const {
    data: templatesData,
    isLoading: templatesLoading
  } = useListSolutions({
    group: 'templates',
    type: hasFlagBlockApiV4() ? 'onboarding' : 'onboarding-v4'
  })

  const {
    data: githubImportData,
    isLoading: githubImportLoading
  } = useListSolutions({
    group: 'githubImport',
    type: 'import-from-github'
  })

  // Computed values for template consumption
  const solutions = computed(() => ({
    recommended: recommendedData.value || [],
    templates: templatesData.value || [],
    githubImport: githubImportData.value || []
  }))

  const loading = computed(() => ({
    recommended: !accountData.value.jobRole || recommendedLoading.value,
    templates: templatesLoading.value,
    githubImport: githubImportLoading.value
  }))

  const openCreateModalToggle = () => {
    tracker.create.createEventInHomeAndHeader({ url: route.path, location: 'header' }).track()
    if (accountData.value.kind !== 'client') {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Only client accounts have access to the create system',
        life: 3000
      })
      return
    }
    createModalStore.toggle()
  }

  const closeCreateModalStore = () => {
    createModalStore.close()
  }

  const currentLabel = computed(() => {
    if (currentWidth.value > SCREEN_BREAKPOINT_MD) {
      return 'Create'
    }
    return ''
  })

  const isMobile = computed(() => {
    return currentWidth.value < SCREEN_BREAKPOINT_SM
  })

  const createModalIsOpen = computed(() => {
    return createModalStore.isOpen
  })
</script>
