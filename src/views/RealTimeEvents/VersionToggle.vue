<template>
  <PrimeButton
    :label="label"
    :icon="icon"
    severity="secondary"
    outlined
    size="small"
    class="whitespace-nowrap flex-shrink-0"
    data-testid="rte-version-toggle"
    @click="onToggle"
  />
</template>

<script setup>
  import { computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import PrimeButton from '@aziontech/webkit/button'
  import { useRealTimeEventsPreferenceStore } from '@/stores/real-time-events-preference'

  const props = defineProps({
    current: {
      type: String,
      required: true,
      validator: (value) => ['v1', 'v2'].includes(value)
    }
  })

  const store = useRealTimeEventsPreferenceStore()
  const router = useRouter()
  const route = useRoute()

  const label = computed(() =>
    props.current === 'v1' ? 'Switch to new view' : 'Switch to classic view'
  )

  const icon = computed(() => (props.current === 'v1' ? 'pi pi-sparkles' : 'pi pi-history'))

  const onToggle = async () => {
    store.toggleVersion()
    await router.push({
      name: store.targetRouteName,
      params: { tab: undefined },
      query: route.query
    })
  }
</script>
