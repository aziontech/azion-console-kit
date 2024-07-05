<template>
  <div class="gap-2 flex items-center">
    <expand-text-column :value="content"></expand-text-column>
    <PrimeButton
      outlined
      icon="pi pi-copy"
      @click.stop="handleCopyContent"
      v-tooltip.top="{ value: 'Copy to clipboard', showDelay: 200 }"
    />
  </div>
</template>

<script>
  import PrimeButton from 'primevue/button'
  import ExpandTextColumn from './expand-text-column.vue'

  export default {
    name: 'text-with-clipboard-column',
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
