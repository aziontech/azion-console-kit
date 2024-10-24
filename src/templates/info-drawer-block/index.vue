<script setup>
  import { computed } from 'vue'
  import Sidebar from 'primevue/sidebar'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'

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

  defineExpose({})
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    position="right"
    :pt="{
      root: { class: 'max-w-4xl w-full p-0' },
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
      <ConsoleFeedback />
    </template>

    <slot name="body"></slot>
  </Sidebar>
</template>
