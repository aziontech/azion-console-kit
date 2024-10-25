<template>
  <div>
    <Messages :messages="messages" />
    <InputSend @send="generateChatResponse" />
  </div>
</template>

<script setup></script>
