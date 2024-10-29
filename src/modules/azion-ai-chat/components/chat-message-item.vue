<template>
  <div
    class="chat-message flex gap-3"
    :class="classRole[role]"
  >
    <ChatAvatar v-if="isSystem" />
    <div class="message-content">
      <div v-html="message" />
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import ChatAvatar from './chat-avatar.vue'
  import { marked } from 'marked'

  const props = defineProps({
    role: String,
    content: String
  })

  const message = computed(() => marked(props.content))
  const isSystem = computed(() => props.role === 'system')

  const classRole = {
    user: 'surface-300 ml-auto mt-5 break-words w-fit rounded-lg h-fit px-4 py-3',
    system: 'mr-auto mt-5'
  }
</script>

<style>
  .chat-message {
    font-size: 16px;
  }

  .chat-message .message-content {
    width: auto;
    overscroll-behavior: none;
    max-width: 100%;
    overflow: hidden;
    background-color: transparent;
  }

  .chat-message h3 {
    font-size: 1.17em !important;
    line-height: 1.75 !important;
    font-weight: 500 !important;
    margin-top: 1.25em !important;
    margin-bottom: 1.25em !important;
  }

  .chat-message p:first-child {
    margin-top: 0 !important;
  }

  .chat-message p {
    tab-size: 4;
    font-feature-settings: normal;
    font-variation-settings: normal;
    box-sizing: border-box;
    color: var(--text-color) !important;
    margin-top: 1.25em !important;
    word-break: break-all;
  }

  .chat-message ul,
  .chat-message ol {
    tab-size: 4;
    font-feature-settings: normal;
    font-variation-settings: normal;
    font-size: 1rem;
    line-height: 1.75;
    border-width: 0;
    border-style: solid;
    border-color: var(--text-color);
    list-style: none;
    box-sizing: border-box;
    color: var(--text-color) !important;
    overscroll-behavior: contain !important;
    list-style-type: disc;
    margin-top: 1.25em;
    margin-bottom: 1.25em;
    padding-left: 1.625em;
  }

  .chat-message a {
    color: var(--text-color-link) !important;
    text-decoration: underline;
    font-weight: 500;
  }

  .chat-message pre {
    overflow: auto;
    display: block;
    word-break: break-all;
    overflow-wrap: break-word;
    border-radius: 7px;
    background: rgb(43, 43, 43);
    color: rgb(248, 248, 242);
    margin-top: 0.8em;
    margin-bottom: 0.8em;
    padding: 0.6em;
    font-size: 0.9em;
    line-height: 1.5em;
  }
</style>
