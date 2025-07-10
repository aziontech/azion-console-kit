<template>
  <div>
    <PrimeButton
      :icon="icon"
      outlined
      data-testid="copy-block__copy-button"
      type="button"
      :aria-label="labelButton"
      :label="labelButton"
      @click="copy"
      class="text-sm"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import PrimeButton from 'primevue/button'
  const emit = defineEmits(['copy'])
  const icon = ref('pi pi-clone')

  const props = defineProps({
    label: {
      type: String
    }
  })

  const labelButton = ref(props.label)

  const copy = () => {
    emit('copy')
    animation()
  }

  const animation = () => {
    if (props.label) {
      icon.value = 'pi pi-check'
      labelButton.value = 'Copied'
      setTimeout(() => {
        icon.value = 'pi pi-clone'
        labelButton.value = props.label
      }, 2000)
    } else {
      icon.value = 'pi pi-check'
      setTimeout(() => {
        icon.value = 'pi pi-clone'
      }, 2000)
    }
  }
</script>
