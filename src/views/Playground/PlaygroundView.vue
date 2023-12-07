<template>
  <div class="relative bg-black/50 z-10 flex h-screen justify-content-start">
    <!-- <ProgressSpinner />  -->
    <ProgressBar class="top-[56px] sticky" mode="indeterminate" style="height: 6px"></ProgressBar>
  </div>
</template>

<script setup>
  import ProgressBar from 'primevue/progressbar';
  // import ProgressSpinner from 'primevue/progressspinner';
</script>

