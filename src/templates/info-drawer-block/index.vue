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

  const handlePositionDrawer = ref('right')

  const handlePosition = () => {
    if (handlePositionDrawer.value === 'right') {
      handlePositionDrawer.value = 'full'
    } else {
      handlePositionDrawer.value = 'right'
    }
  }

  const sizeSidebar = computed(() =>
    handlePositionDrawer.value === 'right' ? 'max-w-4xl w-full p-0' : 'w-full p-0'
  )

  const iconExpand = computed(
    () => `pi pi-window-${handlePositionDrawer.value === 'right' ? 'maximize' : 'minimize'}`
  )

  defineExpose({})
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    :position="handlePositionDrawer"
    :pt="{
      root: { class: sizeSidebar },
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
        <ConsoleFeedback styleTextColor="text-color" />
        <Button
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
