<template>
  <div
    class="bg-black/20 cursor-progress fixed w-full"
    :class="customClasses"
    v-if="showLoading"
  >
    <ProgressBar
      class="sticky"
      mode="indeterminate"
      style="height: 0.375rem"
    />
  </div>
</template>

<script setup>
  import ProgressBar from 'primevue/progressbar'

  defineOptions({ name: 'page-loading-block' })
  defineProps({
    showLoading: Boolean,
    customClasses: {
      type: String,
      default: 'z-[5000] mt-[3.5rem] min-h-screen'
    }
  })
</script>
