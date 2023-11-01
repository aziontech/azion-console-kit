<template>
  <PrimeTag
    v-bind="content"
    class="cursor-pointer"
    @click="handleClick"
  />
</template>

<script>
  import PrimeTag from 'primevue/tag'

  export default {
    name: 'clickable-tag-column',
    components: {
      PrimeTag
    },
    props: {
      content: {
        type: Object,
        required: true
      },
      clickAction: {
        required: false,
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
