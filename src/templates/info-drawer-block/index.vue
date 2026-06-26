<script setup>
  import { computed, ref } from 'vue'
  import { useMediaQuery } from '@vueuse/core'
  import Sidebar from '@aziontech/webkit/sidebar'
  import Button from '@aziontech/webkit/button'

  defineOptions({ name: 'info-drawer-block' })
  const emit = defineEmits(['update:visible'])

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      required: true
    },
    widthClass: {
      type: String,
      default: 'max-w-4xl'
    },
    // Opt-in: present as a bottom sheet on mobile (slide up from the bottom)
    // instead of the right-side drawer. Default keeps existing behavior so the
    // other InfoDrawerBlock consumers are unaffected.
    bottomSheetOnMobile: {
      type: Boolean,
      default: false
    }
  })
  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const isMobile = useMediaQuery('(max-width: 767.98px)')
  const useBottomSheet = computed(() => props.bottomSheetOnMobile && isMobile.value)

  const handlePositionDrawer = ref('right')

  const handlePosition = () => {
    if (handlePositionDrawer.value === 'right') {
      handlePositionDrawer.value = 'full'
    } else {
      handlePositionDrawer.value = 'right'
    }
  }

  const drawerPosition = computed(() =>
    useBottomSheet.value ? 'bottom' : handlePositionDrawer.value
  )

  const sizeSidebar = computed(() => {
    if (useBottomSheet.value) return 'w-full max-h-[90vh] p-0 rounded-t-2xl overflow-hidden'
    return handlePositionDrawer.value === 'right' ? `${props.widthClass} w-full p-0` : 'w-full p-0'
  })

  const iconExpand = computed(
    () => `pi pi-window-${handlePositionDrawer.value === 'right' ? 'maximize' : 'minimize'}`
  )

  defineExpose({})
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    :position="drawerPosition"
    :pt="{
      root: { class: sizeSidebar },
      header: { class: 'flex justify-between font-medium px-8' },
      headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
      closeButton: { class: 'border surface-border' },
      content: {
        class: '[&::-webkit-scrollbar]:hidden flex flex-col  overflow w-full md:p-8 pb-0'
      }
    }"
  >
    <template #header>
      <h2 class="text-xl truncate">{{ props.title }}</h2>
      <div class="flex gap-2 items-center">
        <slot name="header-actions"></slot>
        <Button
          v-if="!useBottomSheet"
          outlined
          class="text-color"
          :icon="iconExpand"
          @click="handlePosition"
        ></Button>
      </div>
    </template>

    <slot name="body"></slot>
  </Sidebar>
</template>
