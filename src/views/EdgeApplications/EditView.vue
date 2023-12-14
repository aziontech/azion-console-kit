<template>
  <div>
    <h1>{{ helloWord }}</h1>
  </div>
</template>
<script setup>
  import { ref } from 'vue'

  const helloWord = ref('Hello World')
</script>
