<template>
  <div class="flex flex-wrap gap-3">
    <Tag
      :severity="statustag(props.data.security)"
      v-if="props.data.security"
      :value="`Secure: ${props.data.security}`"
    />

    <Tag
      :severity="statustag(props.data['score_keep-alive'])"
      v-if="props.data['score_keep-alive']"
      :value="`Keep Alive: ${props.data['score_keep-alive']}`"
    />

    <Tag
      :severity="statustag(props.data.score_gzip)"
      v-if="props.data.score_gzip"
      :value="`Compress Transfer: ${props.data.score_gzip}`"
    />

    <Tag
      :severity="statustag(props.data.score_compress)"
      v-if="props.data.score_compress"
      :value="`Compress Images: ${props.data.score_compress}`"
    />

    <Tag
      :severity="statustag(props.data.cdn)"
      v-if="props.data.cdn"
      :value="`Effective CDN: ${props.data.cdn}`"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import Tag from 'primevue/tag'

  const statustag = (score) => {
    if (score === 'A+' || score === 'A' || score === 'B') return 'success'
    if (score === 'C' || score === 'D') return 'warning'
    if (score === 'E' || score === 'F') return 'danger'
  }

  const props = defineProps({
    data: ref({
      type: Object,
      require: true
    })
  })
</script>
