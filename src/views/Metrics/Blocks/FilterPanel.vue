<script setup>
import Card from 'primevue/card';
import IntervalFilter from './FilterPartials/IntervalFilter';
import ContentFilter from './FilterPartials/ContentFilter';
import { onMounted, ref } from 'vue';

// const props = defineProps({})

onMounted(() => {
  interval.value = intervalOptions.value[0]
})

const interval = ref();
const intervalOptions = ref([
  { name: 'Last Hour', code: '1' },
  { name: 'last_24_hours', code: '24' },
  { name: 'last_7_days', code: '168' },
  { name: 'last_30_days', code: '720' },
  { name: 'last_6_months', code: '4320' },
  { name: 'custom', code: 'custom' }
]);

</script>

<template>
  <Card class="p-3.5 mb-8">
    <template #content>
      <div class="pb-4">
        <IntervalFilter />
      </div>

      <ContentFilter />
    </template>
  </Card>
</template>