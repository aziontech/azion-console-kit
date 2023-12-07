<template>
  <section class="w-full min-h-[calc(100vh-120px)] relative">
    <div class="w-full max-w-screen-2xl mx-auto">
      <Message
        severity="warn"
        :closable="false"
        :pt="{
          root: { class: 'mx-3 sm:mx-8 mt-4' },
          wrapper: { class: 'py-3 px-8 ' }
        }"
      >
        <template #messageicon>
          <Avatar
            icon="pi pi-exclamation-triangle"
            class="bg-yellow-600 bg-opacity-20 text-yellow-600 mr-2"
          />
        </template>
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
  import Avatar from 'primevue/avatar'
</script>
