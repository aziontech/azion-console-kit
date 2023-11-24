<template>
  <section class="w-full min-h-[calc(100vh-120px)] relative">
    <slot name="heading"></slot>
    <section class="w-full h-full flex flex-col max-w-screen-2xl mx-auto mb-8">
      <slot name="content"></slot>
    </section>
  </section>
</template>
<script setup>
  defineOptions({ name: 'BannerContentBlock' })
</script>
