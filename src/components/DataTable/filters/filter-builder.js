import { h } from 'vue'
import DropdownFilterField from './dropdown-filter-field.vue'
import EmailFilterField from './email-filter-field.vue'
import TextFilterField from './text-filter-field.vue'

const STATUS_OPTIONS = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false }
]

const INFRASTRUCTURE_OPTIONS = [
  { label: 'Production', value: 1 },
  { label: 'Staging', value: 2 }
]

const MANAGED_OPTIONS = [
  { label: 'True', value: true },
  { label: 'False', value: false }
]

const CERTIFICATE_TYPE_OPTIONS = [
  { label: 'TLS Certificate', value: 'edge_certificate' },
  { label: 'Trusted CA Certificate', value: 'trusted_ca_certificate' }
]

export const filterBuilder = ({ filterKey, filterValue, onUpdate, onValidation }) => {
  const normalizedKey = filterKey.toLowerCase()

  switch (normalizedKey) {
    case 'active':
    case 'status':
      return h(DropdownFilterField, {
        modelValue: filterValue,
        'onUpdate:modelValue': onUpdate,
        options: STATUS_OPTIONS,
        placeholder: 'Select status'
      })

    case 'infrastructure':
      return h(DropdownFilterField, {
        modelValue: filterValue,
        'onUpdate:modelValue': onUpdate,
        options: INFRASTRUCTURE_OPTIONS,
        placeholder: 'Select infrastructure'
      })

    case 'lasteditor':
      return h(EmailFilterField, {
        modelValue: filterValue,
        'onUpdate:modelValue': onUpdate,
        onValidation: onValidation
      })
    case 'managed':
      return h(DropdownFilterField, {
        modelValue: filterValue,
        'onUpdate:modelValue': onUpdate,
        options: MANAGED_OPTIONS,
        placeholder: 'Select managed'
      })
    case 'type':
      return h(DropdownFilterField, {
        modelValue: filterValue,
        'onUpdate:modelValue': onUpdate,
        options: CERTIFICATE_TYPE_OPTIONS,
        placeholder: 'Select type'
      })
    default:
      return h(TextFilterField, {
        modelValue: filterValue,
        'onUpdate:modelValue': onUpdate
      })
  }
}
