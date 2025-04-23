<template>
  <div class="flex flex-wrap max-w-full">
    <span
      v-for="(item, index) in value"
      :key="index"
    >
      <span class="code-log-body">{{ item.key }}:</span>
      <span class="ml-1 value-code-log-body">{{ formatValue(item.value) }}</span>
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

  const formatValue = (text) => {
    const formattedText = text.toString().slice(0, 100)
    return text.length > 100 ? `${formattedText}...` : formattedText
  }
</script>
