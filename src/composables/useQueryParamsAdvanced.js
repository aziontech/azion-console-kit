// composables/useQueryParams.js
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Create and manage query parameters state, allowing controlled application
 * to the URL. Supports defaults, overrides, debounce for auto-apply, and push vs replace modes.
 *
 * @param {Object} config
 * @param {Object} config.defaults – initial values for parameters
 * @param {Function} config.decode – function(key, rawValue) → typedValue
 * @param {Function} config.encode – function(key, value) → stringValue
 * @param {('push'|'replace')} config.mode – navigation mode for applying
 * @param {number} config.autoApplyDelay – delay in ms for auto-apply
 * @param {string[]} config.autoApplyKeys – keys for which auto-apply is enabled
 * @returns {Object} api for state manipulation
 */
export function useQueryParams({
  defaults = {},
  decode = (key, val) => val,
  encode = (key, val) => (val == null ? '' : String(val)),
  mode = 'replace',
  autoApplyDelay = 0,
  autoApplyKeys = []
} = {}) {
  const route = useRoute()
  const router = useRouter()

  const state = ref({ ...defaults, ...mapRawQuery(route.query, decode) })

  const debounceTimers = new Map()

  const stopRouteWatcher = watch(
    () => route.fullPath,
    () => {
      state.value = { ...defaults, ...mapRawQuery(route.query, decode) }
    }
  )

  onMounted(() => {
    state.value = { ...defaults, ...mapRawQuery(route.query, decode) }
  })

  onBeforeUnmount(() => {
    stopRouteWatcher()
    debounceTimers.forEach((timer) => clearTimeout(timer))
    debounceTimers.clear()
  })

  function setParam(key, value) {
    state.value[key] = value
    if (autoApplyDelay > 0 && autoApplyKeys.includes(key)) {
      scheduleAutoApply(key)
    }
  }

  function removeParam(key) {
    delete state.value[key]
  }

  function applyParams(overrideValues = {}) {
    const merged = { ...state.value, ...overrideValues }
    const cleaned = cleanParams(merged, encode)
    const navMethod = mode === 'push' ? router.push : router.replace
    navMethod.call(router, { query: cleaned })
  }

  function resetParams(keysToReset = null) {
    if (Array.isArray(keysToReset)) {
      keysToReset.forEach((key) => {
        if (Object.hasOwn(defaults, key)) {
          state.value[key] = defaults[key]
        } else {
          delete state.value[key]
        }
      })
    } else {
      state.value = { ...defaults }
    }
    applyParams()
  }

  function syncFromUrl() {
    state.value = { ...defaults, ...mapRawQuery(route.query, decode) }
  }

  function scheduleAutoApply(key) {
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key))
    }
    const timer = setTimeout(() => {
      applyParams()
      debounceTimers.delete(key)
    }, autoApplyDelay)
    debounceTimers.set(key, timer)
  }

  return {
    state,
    setParam,
    removeParam,
    applyParams,
    resetParams,
    syncFromUrl
  }
}

// --- PRIVATE HELPERS ---

function mapRawQuery(rawQuery, decode) {
  const result = {}
  Object.keys(rawQuery).forEach((key) => {
    result[key] = decode(key, rawQuery[key])
  })
  return result
}

function cleanParams(params, encode) {
  const result = {}
  Object.keys(params).forEach((key) => {
    const val = params[key]
    if (val !== undefined && val !== null && val !== '') {
      result[key] = encode(key, val)
    }
  })
  return result
}
