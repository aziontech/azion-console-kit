<script setup>
  const props = defineProps({
    text: {
      type: String,
      required: true
    },
    iconSrc: {
      type: String,
      required: true
    }
  })
</script>
<template>
  <button
    type="button"
    class="deep-chat-suggestion-button"
    :style="`
    width: 230px;
    text-align:left;
    max-width:100%;
    height: 102px;
    padding: 16px;
    gap: 16px; 
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    font-weight: inherit;
    text-transform: none;
    cursor: pointer;
    border-width: 1px;
    border-style: solid;
    background-color: var(--surface-section);
    outline-color: var(--surface-50);
    border-color: var(--surface-600);
    box-sizing: border-box;
    color: var(--text-color-secondary);
    font-size: 14px;
    line-height: 1.25rem;
    `"
  >
    <div :style="`display:flex;flex-direction:column;align-items:flex-start;gap:1rem`">
      <img
        :style="`width:16px;height:16px;object-fit:cover;`"
        :src="iconSrc"
      />

      {{ props.text }}
    </div>
  </button>
</template>
