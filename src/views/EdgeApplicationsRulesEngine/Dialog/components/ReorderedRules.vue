<template>
  <div>
    <p
      v-if="title"
      class="font-normal text-xs text-color-secondary"
    >
      {{ title }}
    </p>

    <RuleChangeDetail
      v-for="rule in rules"
      :key="rule.id"
      :rule="rule"
    />
  </div>
</template>

<script setup>
  import RuleChangeDetail from './RuleChangeDetail.vue'

  defineProps({
    title: {
      type: String,
      default: ''
    },
    rules: {
      type: Array,
      required: true
    }
  })
</script>
