<template>
  <div
    class="gap-2 flex items-center"
    v-tooltip.bottom="tooltipText"
  >
    <PrimeAvatar :label="nameInitial" />
    <p>{{ text }}</p>
  </div>
</template>

<script>
  import PrimeAvatar from 'primevue/avatar'

  export default {
    name: 'avatar-with-text-tooltip-column',
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
      },
      tooltipText: {
        type: String,
        required: true
      }
    }
  }
</script>
