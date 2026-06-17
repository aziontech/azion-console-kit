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
    // Determine the target deterministically from the page we're actually on
    // (`props.current`), not by blindly flipping the store. The persisted
    // store value can be out of sync with the rendered page, in which case a
    // blind toggle would point back at the current route — `router.push` then
    // no-ops and the button appears to need a second click.
    const target = props.current === 'v1' ? 'v2' : 'v1'
    store.setVersion(target)
    await router.push({
      name: store.targetRouteName,
      params: { tab: undefined },
      query: route.query
    })
  }
</script>
