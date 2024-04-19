<template>
  <div class="grid grid-col-1 p-10">
    <div class="">
        <Password 
        class="col-span-1 min-w-full"
        toggleMask 
        v-model="value"
        promptLabel="Choose a password"
        weakLabel="Weak" 
        mediumLabel="Medium"
        strongLabel="Strong" 
        :pt="{
          meter: 'rounded-md',
          meterLabel: 'text-sm'
        }"
        >
          <template #header>
          </template>
          <template #footer>
              <div class="mt-4 text-sm space-y-4">
                <Divider />
                <p class="font-medium">Must have at least:</p>
              </div>
              
              <div class="text-sm p-4 py-0 mt-2">
                <ul class="list-square font-normal space-y-2 text-color-secondary">
                    <li>8 characters</li>
                    <li>1 uppercase letter</li>
                    <li>1 lowercase letter</li>
                    <li>1 number</li>
                    <li>1 special character (Example: !?@#$%)</li>
                </ul>
              </div>
          </template>
        </Password>
    </div>
  </div>
</template>

<script setup>
  import Password from 'primevue/password';
  import Divider from 'primevue/divider';
  import { ref } from "vue"; 
</script>
