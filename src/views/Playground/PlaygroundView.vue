
<template>
  <div class="flex p-20 items-center">
    <ToggleButton v-model="checked" onIcon="pi pi-moon" offIcon="pi pi-dark" onLabel="" offLabel="" />
  </div>

</template>

<script setup>
  import { ref } from 'vue';
  import ToggleButton from 'primevue/togglebutton';

  const checked = ref(false);
</script>
  
