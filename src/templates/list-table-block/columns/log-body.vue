<template>
  <div class="text-gray-700 flex flex-wrap">
    <span
      v-for="(item, index) in value"
      :key="index"
    >
      <span class="font-bold text-secondary bg-secondary">{{ item.key }}:</span>
      <span class="ml-1 w-24 overflow-hidden text-ellipsis whitespace-nowrap">{{
        item.value
      }}</span>
      <span
        v-if="index < value.length - 1"
        class="mx-2"
      ></span>
    </span>
  </div>
</template>

<script setup>
  defineOptions({ name: 'lob-body' })

  defineProps({
    value: {
      type: Array,
      required: true
    }
  })
</script>
