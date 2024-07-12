<template>
  <div class="ml-0 w-full mt-0 grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
    <PrimeButton
      v-for="solution in props.solutions"
      :key="solution.id"
      class="p-6 text-left h-[180px] border-solid border surface-border hover:border-primary transition-all"
      link
      type="button"
      @click="goToSolution(solution)"
    >
      <div class="flex flex-col h-full justify-between gap-3.5 items-start">
        <div class="flex gap-3.5 flex-col">
          <div
            class="w-10 h-10 rounded surface-border border flex justify-center items-center bg-white overflow-hidden"
          >
            <img
              :src="solution.vendor.icon"
              :alt="solution.vendor.name"
            />
          </div>
          <div class="flex flex-col">
            <span class="line-clamp-1 h-5 text-color text-sm font-medium">
              {{ solution.name }}
            </span>
            <span class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2">
              {{ solution.headline }}
            </span>
          </div>
        </div>
      </div>
    </PrimeButton>
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import { useRouter } from 'vue-router'

  const $router = useRouter()

  const props = defineProps({
    solutions: Array
  })

  const goToSolution = (solution) => {
    const params = {
      vendor: solution.vendor.slug,
      solution: solution.slug
    }
    $router.push({ name: 'marketplace-solution', params })
  }
</script>
