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
    class="flex w-full gap-3 justify-end h-16 items-center border-t surface-border sticky bottom-0 surface-section z-50 px-2 md:px-8"
  >
    <PrimeButton
      severity="primary"
      outlined
      data-testid="action-bar__go-back"
      class="max-md:w-full md:min-w-[5rem]"
      label="Back to list"
      @click="handleClick"
    />
  </div>
</template>
