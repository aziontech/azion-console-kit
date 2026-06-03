import { computed, effectScope, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import {
  readScoped,
  writeScoped,
  removeScoped,
  migrateGuestTo
} from '@/helpers/client-scoped-storage'
import { onSwitchAccount } from '@/services/v2/base/auth/session-broadcast'

const BASE_KEY = 'additional-data-form-state:v1'

const FIELD_KEYS = [
  'usageIntent',
  'role',
  'companySize',
  'companyWebsite',
  'fullName',
  'termsAccepted'
]

const isStorageAvailable = () => typeof window !== 'undefined' && Boolean(window.localStorage)

const _usageIntent = ref(undefined)
const _role = ref(undefined)
const _companySize = ref(undefined)
const _companyWebsite = ref(undefined)
const _fullName = ref(undefined)
const _termsAccepted = ref(undefined)

const state = computed(() => ({
  usageIntent: _usageIntent.value,
  role: _role.value,
  companySize: _companySize.value,
  companyWebsite: _companyWebsite.value,
  fullName: _fullName.value,
  termsAccepted: _termsAccepted.value
}))

const sanitizeSnapshot = (snapshot) =>
  FIELD_KEYS.reduce((acc, key) => {
    if (snapshot[key] !== undefined) acc[key] = snapshot[key]
    return acc
  }, {})

const writePersistedState = () => {
  const sanitized = sanitizeSnapshot(state.value)
  if (!Object.keys(sanitized).length) {
    removeScoped(BASE_KEY)
    return
  }
  writeScoped(BASE_KEY, sanitized)
}

const applyToRefs = (data) => {
  const snapshot = data || {}
  _usageIntent.value = snapshot.usageIntent
  _role.value = snapshot.role
  _companySize.value = snapshot.companySize
  _companyWebsite.value = snapshot.companyWebsite
  _fullName.value = snapshot.fullName
  _termsAccepted.value = snapshot.termsAccepted
}

const hydrateFromScope = () => {
  applyToRefs(readScoped(BASE_KEY))
}

let _isSynced = false
const _moduleScope = effectScope(true)

const setupSync = () => {
  if (_isSynced) return
  _isSynced = true
  if (!isStorageAvailable()) return

  const accountStore = useAccountStore()

  hydrateFromScope()

  _moduleScope.run(() => {
    watch(
      () => accountStore.account?.client_id,
      (newId, oldId) => {
        if (newId && !oldId) {
          migrateGuestTo(BASE_KEY, newId)
          hydrateFromScope()
        } else if (newId && oldId && newId !== oldId) {
          applyToRefs(undefined)
          hydrateFromScope()
        } else if (!newId && oldId) {
          applyToRefs(undefined)
        }
      }
    )
  })

  onSwitchAccount(() => {
    applyToRefs(undefined)
    hydrateFromScope()
  })
}

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

  writePersistedState()
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
  applyToRefs(undefined)
  removeScoped(BASE_KEY)
}

export function useAdditionalDataFormState() {
  setupSync()
  return {
    state,
    setField,
    hydrate,
    clear
  }
}
