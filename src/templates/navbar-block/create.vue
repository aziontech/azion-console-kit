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
    class="w-full"
    :pt="{
      root: { class: ' hidden w-full lg:max-w-screen-lg 2xl:max-w-screen-xl h-[640px] sm:flex' },
      content: { class: 'overflow-auto w-full  h-full p-0' },
      mask: { class: 'hidden sm:flex' }
    }"
    position="center"
    :dismissableMask="true"
    @update:visible="closeCreateModalStore()"
  >
    <div>
      <CreateModalBlock @closeModal="closeCreateModalStore()" />
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
        <PrimeButton
          icon="pi pi-times"
          @click="closeCreateModalStore()"
          size="small"
          class="flex-none surface-border text-sm w-8 h-8"
          text
        />
      </div>
    </template>
    <CreateModalBlock @closeModal="closeCreateModalStore()" />
  </Sidebar>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import { useCreateModalStore } from '@/stores/create-modal'
  import { useRoute } from 'vue-router'

  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import Sidebar from 'primevue/sidebar'
  import CreateModalBlock from '@/templates/create-modal-block'
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'navbar-create-block' })

  const route = useRoute()
  const createModalStore = useCreateModalStore()
  const currentWidth = inject('currentWidth')
  const SCREEN_BREAKPOINT_MD = 768

  const openCreateModalToggle = () => {
    tracker.create.createEventInHomeAndHeader({ url: route.path, location: 'header' }).track()
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

  const createModalIsOpen = computed(() => {
    return createModalStore.isOpen
  })
</script>
