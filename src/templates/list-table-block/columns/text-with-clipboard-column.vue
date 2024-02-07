<template>
  <div class="gap-2 flex items-center">
    <expand-text-column :value="content"></expand-text-column>
    <PrimeButton
      text
      icon="pi pi-copy"
      @click.stop="handleCopyContent"
      v-tooltip.bottom="{ value: 'Copy to clipboard', showDelay: 200 }"
    />
  </div>
</template>

<script>
  import PrimeButton from 'primevue/button'
  import ExpandTextColumn from './expand-text-column.vue'

  export default {
    name: 'avatar-with-text-column',
    components: {
      PrimeButton,
      ExpandTextColumn
    },
    props: {
      content: {
        type: String,
        required: true
      },
      copyContentService: {
        required: true,
        type: Function
      }
    },
    methods: {
      handleCopyContent() {
        this.copyContentService(this.content)
      }
    }
  }
</script>
