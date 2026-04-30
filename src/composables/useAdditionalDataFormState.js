import { computed, ref } from 'vue'

const STORAGE_KEY = 'additional-data-form-state:v1'
const FIELD_KEYS = [
  'usageIntent',
  'role',
  'companySize',
  'companyWebsite',
  'fullName',
  'termsAccepted'
]

const isStorageAvailable = () => typeof window !== 'undefined' && Boolean(window.localStorage)

const removePersistedState = () => {
  if (!isStorageAvailable()) return
  window.localStorage.removeItem(STORAGE_KEY)
}

const readPersistedState = () => {
  if (!isStorageAvailable()) return {}

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) return {}

    const parsedValue = JSON.parse(rawValue)
    if (!parsedValue || typeof parsedValue !== 'object') {
      removePersistedState()
      return {}
    }

    return parsedValue
  } catch {
    removePersistedState()
    return {}
  }
}

const writePersistedState = (snapshot) => {
  if (!isStorageAvailable()) return

  const sanitizedSnapshot = FIELD_KEYS.reduce((acc, key) => {
    const value = snapshot[key]
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {})

  if (!Object.keys(sanitizedSnapshot).length) {
    removePersistedState()
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedSnapshot))
}

const initialState = readPersistedState()

const _usageIntent = ref(initialState.usageIntent)
const _role = ref(initialState.role)
const _companySize = ref(initialState.companySize)
const _companyWebsite = ref(initialState.companyWebsite)
const _fullName = ref(initialState.fullName)
const _termsAccepted = ref(initialState.termsAccepted)

const setField = (key, value) => {
  switch (key) {
    case 'usageIntent':
      _usageIntent.value = value
      break
    case 'role':
      _role.value = value
      break
    case 'companySize':
      _companySize.value = value
      break
    case 'companyWebsite':
      _companyWebsite.value = value
      break
    case 'fullName':
      _fullName.value = value
      break
    case 'termsAccepted':
      _termsAccepted.value = value
      break
  }

  writePersistedState(state.value)
}

const hydrate = (fields = {}) => {
  Object.entries(fields).forEach(([key, fieldRef]) => {
    const value = state.value[key]
    if (value !== undefined && fieldRef) {
      fieldRef.value = value
    }
  })
}

const clear = () => {
  _usageIntent.value = undefined
  _role.value = undefined
  _companySize.value = undefined
  _companyWebsite.value = undefined
  _fullName.value = undefined
  _termsAccepted.value = undefined
  removePersistedState()
}

const state = computed(() => ({
  usageIntent: _usageIntent.value,
  role: _role.value,
  companySize: _companySize.value,
  companyWebsite: _companyWebsite.value,
  fullName: _fullName.value,
  termsAccepted: _termsAccepted.value
}))

export function useAdditionalDataFormState() {
  return {
    state,
    setField,
    hydrate,
    clear
  }
}
