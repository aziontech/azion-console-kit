<template>
  <div class="flex flex-col gap-4 justify-center align-middle text-center">
    <h1 class="text-4xl font-normal text-gray-600">This page is under development.</h1>
    <PrimeButton
      class="w-fit self-center"
      @click="navigateToHomePage"
    >
      Go back to homepage
    </PrimeButton>
  </div>
</template>

<script>
  import PrimeButton from 'primevue/button'

  export default {
    name: 'under-development-view',
    components: { PrimeButton },
    methods: {
      navigateToHomePage() {
        this.$router.push('/')
      }
    }
  }
</script>
