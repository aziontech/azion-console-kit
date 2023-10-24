<template>
  <div class="gap-2 flex items-center">
    <PrimeAvatar :label="nameInitial" />
    <p>{{ text }}</p>
  </div>
</template>

<script>
  import PrimeAvatar from 'primevue/avatar'

  export default {
    name: 'avatar-with-text-column',
    components: {
      PrimeAvatar
    },
    props: {
      nameInitial: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      }
    }
  }
</script>
