<template>
  <div class="gap-2 flex items-center">
    {{ content || '-' }}
    <PrimeButton
      v-if="content"
      outlined
      icon="pi pi-copy"
      @click.stop="handleCopyContent"
      v-tooltip.top="{ value: 'Copy to clipboard', showDelay: 200 }"
    />
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  defineOptions({ name: 'text-full-with-clipboard-column' })

  const props = defineProps({
    content: {
      type: String
    },
    copyContentService: {
      required: true,
      type: Function
    }
  })

  const handleCopyContent = () => {
    props.copyContentService(props.content)
  }
</script>
