<script setup>
  import Sidebar from 'primevue/sidebar'
  import ConsoleFeedback from '@/templates/navbar-block/feedback'
  const emit = defineEmits(['update:visible'])

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: 'right'
    }
  })

  const toggleSidebar = (value) => {
    emit('update:visible', value)
  }
</script>

<template>
  <Sidebar
    :visible="props.visible"
    @update:visible="toggleSidebar"
    :position="props.position"
    :pt="{
      root: { class: 'max-w-4xl w-full p-0' },
      headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between' }
    }"
  >
    <template #header>
      <div>Create Edge Application</div>
      <ConsoleFeedback />
    </template>
    <template #default>
      <div class="flex flex-col w-full md:p-8 pb-0">
        <form class="w-full flex flex-col gap-8"></form>
      </div>
    </template>
  </Sidebar>
</template>
