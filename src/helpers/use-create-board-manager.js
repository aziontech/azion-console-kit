import { ref } from 'vue'

export function useCreateBoardManager() {
  const enabled = ref(0)

  function open() {
    enabled.value = 1
  }

  function close() {
    enabled.value = 0
  }

  return {
    enabled,
    open,
    close
  }
}
