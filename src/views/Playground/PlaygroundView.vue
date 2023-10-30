<template>
  <div class="flex flex-col p-10 items-center justify-center gap-2">
    <InlineMessage
      class="w-full"
      severity="success"
    >Message Content</InlineMessage>
    <InlineMessage
      class="w-full"
      severity="info"
    >Message Content</InlineMessage>
    <InlineMessage
      class="w-full"
      severity="warn"
  >Message Content</InlineMessage>
  <InlineMessage
    class="w-full"
    severity="error"
  >Message Content</InlineMessage>
</div></template>

<script setup>
import InlineMessage from 'primevue/inlinemessage';
</script>