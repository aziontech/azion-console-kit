<template>
  <PrimeButton
    link
    size="small"
    class="p-link underline px-0"
    @click="handleClick"
  >
    {{ content }}
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
