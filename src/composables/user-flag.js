import { ref, computed } from 'vue'

const _flags = ref([])
const BLOCK_INCOMPATIBLE_ENDPOINT_V4 = 'block_apiv4_incompatible_endpoints'

const setFeatureFlags = (flagsArray = []) => {
  _flags.value = Array.isArray(flagsArray) ? flagsArray : []
}

const useFlag = (flagName) => {
  return computed(() => _flags.value?.includes(flagName) ?? false)
}

const hasFlagBlockApiV4 = () => {
  return useFlag(BLOCK_INCOMPATIBLE_ENDPOINT_V4).value
}

export { setFeatureFlags, useFlag, hasFlagBlockApiV4 }
