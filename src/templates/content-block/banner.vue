<template>
  <section class="w-full relative flex flex-col">
    <div class="w-full mx-auto"></div>
    <slot name="heading"></slot>
    <section class="w-full flex flex-1 flex-col mx-auto mb-8">
      <slot name="content"></slot>
    </section>
  </section>
</template>
<script setup>
  defineOptions({ name: 'BannerContentBlock' })
</script>
