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
    class="flex flex-col items-start w-full justify-center p-3 border-t surface-border sticky bottom-0 surface-section z-50 sm:flex-row sm:py-3 sm:px-8 sm:justify-between"
    :class="{ 'px-0': inDrawer }"
  >
    <div class="flex w-full justify-content-end max-w-screen-2xl mx-auto 2xl:px-8">
      <div class="flex gap-4 self-stretch items-center max-sm:justify-end">
        <PrimeButton
          severity="primary"
          outlined
          label="Back to list"
          @click="handleClick"
        />
      </div>
    </div>
  </div>
</template>
