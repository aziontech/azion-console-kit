<script setup>
  import PrimeButton from 'primevue/button'
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    goBack: {
      type: Function
    },
    inDrawer: Boolean
  })
  const router = useRouter()
  const handleClick = () => {
    if (props.goBack) {
      props.goBack()
      return
    }
    router.go(-1)
  }

  const inDrawerStyles = computed(() => {
    return props.inDrawer
  })
</script>

<template>
  <div
    class="flex flex-col items-start w-full justify-center p-3 border-t surface-border sticky bottom-0 surface-section z-50 sm:flex-row sm:py-3 sm:px-8 sm:justify-between"
  >
    <div
      class="flex w-full justify-content-end max-w-screen-2xl mx-auto 2xl:px-8"
      :class="{
        '2xl:px-0': inDrawerStyles,
        '2xl:px-8': !inDrawerStyles
      }"
    >
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
