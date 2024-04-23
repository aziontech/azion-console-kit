<script setup>
  import PrimeButton from 'primevue/button'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    goBack: {
      type: Function
    },
    inDrawer: {
      type: Boolean,
      default: false
    }
  })
  const router = useRouter()
  const handleClick = () => {
    if (props.goBack) {
      props.goBack()
      return
    }
    router.go(-1)
  }
</script>

<template>
  <div
    class="flex w-full gap-4 justify-end h-14 items-center border-t surface-border sticky bottom-0 surface-section z-50 px-2 md:px-8"
  >
    <PrimeButton
      severity="primary"
      outlined
      class="max-md:w-full"
      label="Back to list"
      @click="handleClick"
    />
  </div>
</template>
