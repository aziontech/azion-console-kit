<template>
  <div class="py-20 px-8 self-center items-center flex flex-col gap-10">
    <slot name="illustration" />
    <div class="flex flex-col gap-6 max-w-4xl">
      <h1 class="text-center text-5xl font-medium">
        {{ title }}
      </h1>
      <p class="max-w-xl text-center text-color-secondary text-lg font-normal leading-7">
        {{ description }}
      </p>

      <div class="flex gap-3 justify-center items-center">
        <slot name="actions"> </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
  defineOptions({ name: 'error-page-block' })
  defineProps({
    title: { type: String, required: true },
    description: { type: String, required: true }
  })
</script>
