<template>
  <p
    class="text-color-secondary py-2"
    data-testid="review-changes-dialog-warning-message-details"
  >
    Rule <span class="font-medium text-color">”{{ rule.name }}”</span> reordered from
    {{ rule.position.immutableValue }} to {{ rule.position.value }}.
  </p>
</template>

<script setup>
  defineProps({
    rule: {
      type: Object,
      required: true
    }
  })
</script>
