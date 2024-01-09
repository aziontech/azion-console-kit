import { useLoadingStore } from '@/stores/loading'

export default function afterEachRoute() {
  const loadingStore = useLoadingStore()
  loadingStore.finishLoading()
}
