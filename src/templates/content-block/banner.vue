<template>
  <section class="w-full min-h-[calc(100vh-120px)] relative">
    <div class="surface-ground w-full">
      <div class="mx-auto">
        <ProjectStageMessageBlock />
      </div>
    </div>
    <div class="w-full mx-auto"></div>
    <slot name="heading"></slot>
    <section class="w-full h-full flex flex-col mx-auto mb-8">
      <slot name="content"></slot>
    </section>
  </section>
</template>
<script setup>
  defineOptions({ name: 'BannerContentBlock' })
  import ProjectStageMessageBlock from './project-stage-message-block.vue'
</script>
