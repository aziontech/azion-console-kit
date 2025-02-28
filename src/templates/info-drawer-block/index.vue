<script setup>
  import { computed, ref } from 'vue'
  import Sidebar from 'primevue/sidebar'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'
  import Button from 'primevue/button'

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
    }
  })
  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const handle = ref('right')

  const handlePosition = () => {
    if (handle.value === 'right') {
      handle.value = 'full'
    } else {
      handle.value = 'right'
    }
  }

  const sizeSidebar = () => {
    if (handle.value === 'right') {
      return 'max-w-4xl w-full p-0'
    }
    return 'w-full p-0'
  }

  const iconExpand = computed(() => {
    if (handle.value === 'right') {
      return 'pi pi-window-maximize'
    }
    return 'pi pi-window-minimize'
  })

  defineExpose({})
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    :position="handle"
    :pt="{
      root: { class: sizeSidebar() },
      header: { class: 'flex justify-between font-medium px-8' },
      headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
      closeButton: { class: 'border surface-border' },
      content: {
        class:
          '[&::-webkit-scrollbar]:hidden flex flex-col justify-between overflow w-full md:p-8 pb-0'
      }
    }"
  >
    <template #header>
      <h2 class="text-xl">{{ props.title }}</h2>
      <div class="flex gap-2 items-center">
        <ConsoleFeedback />
        <Button
          outlined
          :icon="iconExpand"
          @click="handlePosition"
        ></Button>
      </div>
    </template>

    <slot name="body"></slot>
  </Sidebar>
</template>
