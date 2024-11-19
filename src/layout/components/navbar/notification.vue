<template>
  <PrimeButton
    icon="pi pi-bell"
    class="overflow-auto text-white border-header bg-header hover:bg-header-button-hover pl-2 h-8 w-8"
    badge="9"
    size="small"
    badgeClass="p-badge-danger"
    @click="toggleNotification"
    aria-haspopup="true"
    aria-controls="overlay_menu"
    v-tooltip.bottom="{ value: 'Notifications', showDelay: 200 }"
    :pt="{
      root: { class: 'overflow-visible' },
      label: { class: 'text-white' },
      icon: { class: 'text-white' },
      badge: { class: 'absolute right-[-4px] top-[-8px]' }
    }"
  />

  <PrimeMenu
    ref="menu"
    id="overlay_menu"
    :model="items"
    :popup="true"
  >
    <template #start>
      <div class="m-1 surface-border border border-dashed rounded-md flex items-center h-96">
        <p class="text-color text-sm font-medium text-center w-full">
          This section is under development.
        </p>
      </div>
    </template>
  </PrimeMenu>
</template>

<script setup>
  import { ref } from 'vue'

  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'

  defineOptions({ name: 'navbar-notiication-block' })

  const menu = ref(null)

  const toggleNotification = (event) => {
    menu.value.toggle(event)
  }
</script>
