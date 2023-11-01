<template>
  <PrimeButton
    link
    @click="handleClick"
  >
    <p class="p-link underline">{{ content }}</p>
  </PrimeButton>
</template>

<script>
  import PrimeButton from 'primevue/button'

  export default {
    name: 'clickable-link-column',
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
        type: Function,
        default: () => {}
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
