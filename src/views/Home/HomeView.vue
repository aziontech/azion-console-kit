<template>
  <div class="p-4 w-full">
    <div class="max-w-screen-sm lg:max-w-7xl mx-auto gap-4">
      <h1 class="text-4xl self-center font-normal text-gray-600">Home</h1>
      <div class="flex">
        <SelectButton
          v-model="value"
          :options="options"
          aria-labelledby="basic"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import SelectButton from 'primevue/selectbutton'

  // Export my assets and components
  export default {
    components: {
      SelectButton
    },
    data() {
      return {
        value: 'All phases',
        options: ['All phases', 'Request', 'Response']
      }
    }
  }
</script>
