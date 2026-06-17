import { ref, computed } from 'vue'

const _flags = ref([])
const BLOCK_INCOMPATIBLE_ENDPOINT_V4 = 'block_apiv4_incompatible_endpoints'
const USE_V6_CONFIGURATIONS = 'use_v6_configurations'

const setFeatureFlags = (flagsArray = []) => {
  _flags.value = Array.isArray(flagsArray) ? flagsArray : []
}

const useFlag = (flagName) => {
  return computed(() => _flags.value?.includes(flagName) ?? false)
}

const hasFlagBlockApiV4 = () => {
  return useFlag(BLOCK_INCOMPATIBLE_ENDPOINT_V4).value
}

const hasFlagUseV6Configurations = () => {
  return useFlag(USE_V6_CONFIGURATIONS).value
}

export {
  setFeatureFlags,
  useFlag,
  hasFlagBlockApiV4,
  hasFlagUseV6Configurations,
  USE_V6_CONFIGURATIONS
}
