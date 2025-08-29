<template>
  <Button
    :icon="icon"
    :iconPos="iconPos"
    :label="label"
    :severity="severity"
    :outlined="outlined"
    :data-testid="dataTestId"
    :size="size"
    @click.stop="click"
  />
</template>

<script setup>
  import Button from 'primevue/button'

  defineProps({
    dataTestId: {
      type: String
    },
    label: {
      type: String,
      default: () => ''
    },
    outlined: {
      type: Boolean,
      default: () => true
    },
    severity: {
      type: String,
      default: () => 'primary',
      options: ['primary', 'secondary', 'info', 'success', 'warning', 'danger']
    },
    iconPos: {
      type: String,
      default: () => 'left',
      options: ['left', 'right']
    },
    icon: {
      type: String,
      default: () => 'pi-trash',
      options: ['pi pi-trash', 'pi pi-delete-left', 'pi pi-times', 'pi pi-times-circle']
    },
    size: {
      type: String,
      default: () => 'normal',
      options: ['small', 'normal', 'large']
    }
  })

  const emit = defineEmits(['delete'])

  const click = () => emit('delete')
</script>
