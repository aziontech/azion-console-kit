import { ref } from 'vue'

export function useCreateBoardManager() {
  const enabled = ref(false)

  function open() {
    enabled.value = true
  }
  
  function close() {
    enabled.value = false
  }

  return {
    enabled,
    open,
    close
  }
}
