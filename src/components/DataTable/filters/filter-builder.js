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

const DATA_TYPES_OPTIONS = [
  {
    label: 'INTEGER',
    value: 'INTEGER'
  },
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'FLOAT', value: 'FLOAT' },
  { label: 'VARCHAR', value: 'VARCHAR' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'DATE', value: 'DATE' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'TIMESTAMP', value: 'TIMESTAMP' },
  { label: 'JSON', value: 'JSON' },
  { label: 'UUID', value: 'UUID' }
]

export const filterBuilder = ({ filterKey, filterHeader, filterValue, onUpdate, onValidation }) => {
  const normalizedKey = String(filterKey || '').toLowerCase()
  const normalizedHeader = String(filterHeader || '').toLowerCase()

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

    case 'last_editor':
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
      const isCertificate = normalizedHeader.includes('certificate')

      return h(DropdownFilterField, {
        modelValue: filterValue,
        'onUpdate:modelValue': onUpdate,
        options: isCertificate ? CERTIFICATE_TYPE_OPTIONS : DATA_TYPES_OPTIONS,
        placeholder: 'Select type'
      })

    default:
      return h(TextFilterField, {
        modelValue: filterValue,
        'onUpdate:modelValue': onUpdate
      })
  }
}
