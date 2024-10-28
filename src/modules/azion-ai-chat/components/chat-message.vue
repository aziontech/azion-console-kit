<!-- src/components/chat-message.vue -->
<template>
  <div class="chat-message flex gap-4" :class="classRole[role]">
    <avatar v-if="role === 'system'" />
    <div class="message-content">
      <p v-html="message" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Avatar from './avatar.vue';
import { marked } from 'marked';

const props = defineProps({
  role: String,
  content: String,
  avatarComponent: {
    type: [String, Object],
    default: null,
  },
});

const message = computed(() => marked(props.content));


const classRole = {
  user: 'surface-300 ml-auto mt-5 break-words w-fit rounded-lg h-fit px-4 py-3',
  system: 'mr-auto mt-5 break-words h-fit'
}
</script>

<style>
.chat-message {
  font-size: 16px;
}

.chat-message h3 {
  font-size: 1.17em !important;
  line-height: 1.75 !important;
  font-weight: 500 !important;
  margin-top: 1.25em !important;
  margin-bottom: 1.25em !important;
}

.chat-message p {
  tab-size: 4;
  font-feature-settings: normal;
  font-variation-settings: normal;
  box-sizing: border-box;
  color: var(--text-color) !important;
  margin-top: 1.25em !important;
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
</style>
