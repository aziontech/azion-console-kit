import { ref, computed } from 'vue'

const _flags = ref([])
const BLOCK_INCOMPATIBLE_ENDPOINT_V4 = 'block_apiv4_incompatible_endpoints'
const IS_AZION_EMAIL = 'is_azion_email'

const setFeatureFlags = (flagsArray = []) => {
  _flags.value = flagsArray
}

const useFlag = (flagName) => {
  return computed(() => _flags.value.includes(flagName))
}

const hasFlagBlockApiV4 = () => {
  return useFlag(BLOCK_INCOMPATIBLE_ENDPOINT_V4).value
}

const hasFlagIsAzionEmail = () => {
  return useFlag(IS_AZION_EMAIL).value
}

export { setFeatureFlags, useFlag, hasFlagBlockApiV4, hasFlagIsAzionEmail }
