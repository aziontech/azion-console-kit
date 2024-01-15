<script setup>
  import SelectButton from 'primevue/selectbutton'
  import { onMounted, ref } from 'vue'

  const props = defineProps({
    subDash: {
      type: Array,
      required: true
    }
  })
  onMounted(() => {
    value.value = options.value[0]
  })
  const value = ref(null)
  const options = ref([
    { name: 'Data Transferred', value: 1 },
    { name: 'Requests', value: 2 },
    { name: 'Status Codes', value: 3 },
    { name: 'Bandwidth Saving', value: 4 }
  ])
</script>

<template>
  <div class="flex flex-column">
    <SelectButton
      class="w-fit"
      v-model="value"
      :options="props.subDash"
      optionLabel="name"
      dataKey="value"
      aria-labelledby="custom"
    />
    <div class="card grid grid-cols-12 gap-4 pt-4 m-0">
      <div
        v-for="item of 3"
        :key="item"
      >
        Report card
      </div>
    </div>
  </div>
</template>
