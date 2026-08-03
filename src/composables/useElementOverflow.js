import { ref, watch, nextTick } from 'vue'
import { useResizeObserver } from '@vueuse/core'

export function useElementOverflow(source) {
  const target = ref(null)
  const isOverflowing = ref(false)

  const update = async () => {
    await nextTick()
    const element = target.value
    isOverflowing.value = !!element && element.scrollWidth > element.clientWidth
  }

  useResizeObserver(target, update)
  watch(source, update, { immediate: true })

  return { target, isOverflowing }
}
