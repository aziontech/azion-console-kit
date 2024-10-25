<template>
  <ul>
    <MessagesListItem
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
    />
  </ul>
</template>

<script setup>
  import MessagesListItem from './MessagesListItem.vue'

  const props = defineProps({
    messages: {
      type: Array,
      required: true
    }
  })
</script>
