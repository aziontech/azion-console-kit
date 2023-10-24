<template>
  <div class="flex flex-col p-10 items-center justify-center gap-2">
    <InlineMessage severity="success">Message Content</InlineMessage>
    <InlineMessage severity="info">Message Content</InlineMessage>
    <InlineMessage severity="warn">Message Content</InlineMessage>
    <InlineMessage severity="error">Message Content</InlineMessage>
  </div>
</template>

<script setup>
import InlineMessage from 'primevue/inlinemessage';
</script>
