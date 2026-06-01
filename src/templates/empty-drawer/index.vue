<script setup>
  import { computed, ref } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import PrimeButton from '@aziontech/webkit/button'

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
    },
    widthClass: {
      type: String,
      default: ''
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

  const resolvedWidthClass = computed(() => {
    if (isExpanded.value) return ''
    if (props.widthClass) return props.widthClass
    return props.isOverlapped ? 'max-w-5xl' : 'max-w-4xl'
  })
</script>

<template>
  <Teleport to="body">
    <Sidebar
      v-model:visible="visibleDrawer"
      :update:visible="toggleDrawerVisibility"
      position="right"
      tabindex="0"
      :pt="{
        root: {
          class: ['w-full', 'transition-all', 'duration-300', 'ease-in-out', resolvedWidthClass]
        },
        headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
        content: { class: 'p-8 mb-14' }
      }"
    >
      <template #header>
        <h2>{{ title }}</h2>
        <div class="flex items-center gap-2">
          <slot name="header-actions"></slot>
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
