<template>
  <section class="w-full min-h-[calc(100vh-120px)] relative">
    <div class="w-full max-w-screen-2xl mx-auto">
      <Message
        severity="warn"
        :closable="false"
        :pt="{
          root: { class: 'bg-orange-50 mx-3 sm:mx-8 my-4' },
          wrapper: { class: 'py-3 px-8 ' }
        }"
      >
        <p class="text-color-secondary">
          <b class="text-color">Experiment in progress.</b>
          You're currently using Azion's Platform Kit. Avoid complex setups as this platform is
          currently undergoing testing and fine-tuning.
        </p>
      </Message>
    </div>
    <slot name="heading"></slot>
    <section class="w-full h-full flex flex-col max-w-screen-2xl mx-auto mb-8">
      <slot name="content"></slot>
    </section>
  </section>
</template>
<script setup>
  defineOptions({ name: 'BannerContentBlock' })
  import Message from 'primevue/message'
</script>
