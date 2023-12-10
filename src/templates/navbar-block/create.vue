<template>
  <PrimeButton
    @click="createModalStore.toggle()"
    icon="pi pi-plus"
    :label="currentLabel"
    class="h-8 w-8 md:w-fit text-white border-header"
    size="small"
    :pt="{
      label: { class: 'text-white' },
      icon: { class: 'text-white' }
    }"
    :class="{
      'bg-header hover:bg-header-button-hover': !createModalStore.isOpen,
      'bg-header-button-enabled': createModalStore.isOpen
    }"
    v-tooltip.bottom="{ value: 'Create', showDelay: 200 }"
  />

  <PrimeDialog
    v-model:visible="createModalStore.isOpen"
    modal
    header="New"
    :pt="{
      root: { class: 'hidden sm:flex' },
      content: { class: 'p-0' },
      mask: { class: 'hidden sm:flex' }
    }"
    position="center"
    :dismissableMask="true"
    :breakpoints="{ '641px': '90vw' }"
    @update:visible="createModalStore.close()"
  >
    <!-- SLOT WIP -->
    <div>
      <CreateModalBlock @closeModal="createBoardManager.close()" />
    </div>
  </PrimeDialog>
</template>

<script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useCreateModalStore } from '@/stores/create-modal'

  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import CreateModalBlock from '@/templates/create-modal-block'

  defineOptions({ name: 'navbar-create-block' })

  const createModalStore = useCreateModalStore()
  const currentWidth = ref(0)

  onMounted(() => {
    currentWidth.value = window.innerWidth
    window.addEventListener('resize', () => {
      currentWidth.value = window.innerWidth
    })
  })

  const currentLabel = computed(() => {
    if (currentWidth.value > 768) {
      return 'Create'
    }
    return ''
  })
</script>
