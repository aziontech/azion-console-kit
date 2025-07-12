<template>
  <PrimeButton
    type="button"
    class="max-sm:w-full"
    icon="pi pi-chevron-down"
    iconPos="right"
    :data-testid="`create_${addButtonLabel}_button`"
    :label="addButtonLabel"
    aria-haspopup="true"
    aria-controls="overlay_menu"
    @click="toggle"
    :severity="severity"
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
  import PrimeButton from 'primevue/button'
  import Menu from 'primevue/menu'
  import { ref } from 'vue'

  const menu = ref(null)

  defineProps({
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

  const toggle = (event) => {
    menu.value.toggle(event)
  }
</script>
