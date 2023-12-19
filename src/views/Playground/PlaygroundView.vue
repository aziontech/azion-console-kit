<template>
  <div class="flex items-center w-auto p-10">
    <Button class="w-fit" label="Open Modal"  @click="visible = true" />
      <Dialog  
      :dismissable-mask="true" 
      v-model:visible="visible" 
      modal 
      :position="position"
      header="Header"
      >
          <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        <template #footer>
          <Button label="Ok" icon="pi pi-check" @click="visible = false" autofocus />
          <Button label="Ok" icon="pi pi-check" @click="visible = false" autofocus />
      </template>
        
      </Dialog>
  </div>
</template>

<script setup>

  import Button from 'primevue/button';
  import Dialog from 'primevue/dialog';

  import { ref } from "vue";

  const visible = ref(false); 

</script>

