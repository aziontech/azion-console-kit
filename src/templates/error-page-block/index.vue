<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="py-20 px-8 self-center items-center flex flex-col gap-10">
    <slot name="illustration" />
    <div class="flex flex-col gap-6 max-w-3xl">
      <h1 class="text-center dark:text-zinc-900 text-5xl font-medium">
        {{ title }}
      </h1>
      <p class="max-w-xl text-center dark:text-stone-500 text-lg font-normal leading-7">
        {{ description }}
      </p>

      <div class="flex gap-3 justify-center items-center">
        <slot name="actions"> </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { defineProps } from 'vue'

  defineProps({
    title: { type: String, required: true },
    description: { type: String, required: true }
  })
</script>
