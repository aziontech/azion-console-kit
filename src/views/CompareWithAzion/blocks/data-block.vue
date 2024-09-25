<template>
  <h2 class="text-3xl" v-html="props.title" />

  <div class="mt-12">
    <h3 class="text-xl mb-8">General</h3>
    <ResumeBlock :data="resumeData" />
  </div>

  <div class="mt-12">
    <h3 class="text-xl mb-8">Page Performance</h3>
    <GradeBlock :items="gradeData" />
  </div>

  <div class="mt-12">
    <h3 class="text-xl mb-8">Security</h3>
    <SecurityBlock :securityHeaders="secureData" />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ResumeBlock from './resume-block.vue'
  import GradeBlock from './grade-block.vue'
  import SecurityBlock from './security-block.vue'

  const props = defineProps({
    title: {
      type: String,
      required: true
    },
    resumeData: ref({
      type: Object,
      required: true
    }),
    gradeData: ref({
      type: Array,
      required: true
    }),
    secureData: ref({
      type: Object,
      required: true
    }),
  })
</script>