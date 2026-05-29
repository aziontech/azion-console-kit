<template>
  <PrimeButton
    :kind="buttonKind"
    size="medium"
    type="button"
    icon="pi pi-chevron-down"
    :data-testid="`create_${addButtonLabel}_button`"
    :label="addButtonLabel"
    aria-haspopup="true"
    aria-controls="overlay_menu"
    @click="toggle"
  />
  <Menu
    ref="menu"
    id="overlay_menu"
    :model="items"
    :popup="true"
    class="min-w-min"
  />
</template>

<script setup>
  import PrimeButton from '@aziontech/webkit/button'
  import Menu from '@aziontech/webkit/menu'
  import { computed, ref } from 'vue'

  const menu = ref(null)

  const props = defineProps({
    addButtonLabel: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      required: false,
      default: () => []
    },
    severity: {
      type: String,
      required: false,
      default: 'primary'
    }
  })

  const SEVERITY_TO_KIND = {
    primary: 'primary',
    secondary: 'secondary',
    contrast: 'secondary',
    danger: 'primary',
    info: 'secondary',
    success: 'primary',
    warn: 'outlined',
    warning: 'outlined'
  }

  const buttonKind = computed(() => SEVERITY_TO_KIND[props.severity] ?? 'primary')

  const toggle = (event) => {
    menu.value.toggle(event)
  }
</script>
