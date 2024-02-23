<script setup>
  import { computed } from 'vue'
  import Sidebar from 'primevue/sidebar'

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
      header: { class: 'flex justify-between text-xl font-medium px-8' },
      closeButton: { class: 'border surface-border' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between overfol' }
    }"
  >
    <template #header>
      <h2>{{ props.title }}</h2>
    </template>

    <slot name="body"></slot>
  </Sidebar>
</template>
