import { computed, ref } from 'vue'

const _usageIntent = ref(undefined)
const _role = ref(undefined)
const _companySize = ref(undefined)
const _companyWebsite = ref(undefined)
const _fullName = ref(undefined)
const _termsAccepted = ref(undefined)

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
