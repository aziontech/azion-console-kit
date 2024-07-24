<template>
  <component
    :is="component"
    v-bind="skeletonProps"
  >
    <slot />
  </component>
</template>

<script setup>
  import { computed } from 'vue'
  import Skeleton from 'primevue/skeleton'

  defineOptions({
    name: 'skeleton-block'
  })

  const props = defineProps({
    isLoaded: {
      type: Boolean,
      required: false
    },
    width: {
      type: String,
      default: '3rem'
    },
    tag: {
      type: String,
      default: 'div',
      validator: (value) => ['div', 'span'].includes(value)
    },
    sizeHeight: {
      type: String,
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    height: {
      type: String,
      default: '1.5rem'
    }
  })

  const mapSize = {
    small: '1.5rem',
    medium: '2rem',
    large: '2.5rem'
  }

  const height = mapSize[props.sizeHeight] || props.height

  const component = computed(() => {
    return props.isLoaded ? props.tag : Skeleton
  })

  const skeletonProps = { width: props.width, height }
</script>
