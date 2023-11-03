<template>
  <PrimeButton
    text
    @click="handleClick"
  >
    <p>{{ content }}</p>
  </PrimeButton>
</template>

<script>
  import PrimeButton from 'primevue/button'

  export default {
    name: 'clickable-text-column',
    components: {
      PrimeButton
    },
    props: {
      content: {
        type: String,
        required: true
      },
      clickAction: {
        required: true,
        type: Function
      },
      clickProps: {
        required: false,
        type: Object,
        default: () => ({})
      }
    },
    methods: {
      handleClick() {
        this.clickAction(this.clickProps)
      }
    }
  }
</script>
