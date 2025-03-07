<script setup>
  import { computed, ref } from 'vue'
  import Sidebar from 'primevue/sidebar'
  import PrimeButton from 'primevue/button'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'

  defineOptions({ name: 'empty-drawer' })

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
    expandable: {
      type: Boolean,
      default: false
    },
    expandedDefault: {
      type: Boolean,
      default: false
    },
    isOverlapped: {
      type: Boolean,
      default: false
    }
  })
  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const isExpanded = ref(props.expandedDefault)

  const toggleExpandDrawer = () => {
    isExpanded.value = !isExpanded.value
  }

  const toggleDrawerVisibility = (isVisible) => {
    emit('update:visible', isVisible)
  }
</script>

<template>
  <Teleport to="body">
    <Sidebar
      v-model:visible="visibleDrawer"
      :update:visible="toggleDrawerVisibility"
      position="right"
      :pt="{
        root: {
          class: [
            'w-full',
            'transition-all',
            'duration-300',
            'ease-in-out',
            {
              'max-w-5xl': !isExpanded && props.isOverlapped,
              'max-w-4xl': !isExpanded && !props.isOverlapped
            }
          ]
        },
        headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
        content: { class: 'p-8 mb-14' }
      }"
    >
      <template #header>
        <h2>{{ title }}</h2>
        <div class="flex items-center gap-2">
          <ConsoleFeedback />
          <PrimeButton
            @click="toggleExpandDrawer"
            outlined
            :icon="isExpanded ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
          />
        </div>
      </template>

      <div class="flex w-full">
        <slot name="content"></slot>
      </div>

      <div class="fixed w-full left-0 bottom-0">
        <slot name="footer"></slot>
      </div>
    </Sidebar>
  </Teleport>
</template>
