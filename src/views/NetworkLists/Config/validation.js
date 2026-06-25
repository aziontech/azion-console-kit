import * as yup from 'yup'

// Shared Network List edit schema. Single source of truth reused by the legacy
// EditView and the versioned form adapter.
export const networkListTypeOptions = [
  { name: 'ASN', value: 'asn' },
  { name: 'Countries', value: 'countries' },
  { name: 'IP/CIDR', value: 'ip_cidr' }
]

export const validationSchema = yup.object({
  name: yup.string().required('Name is a required field'),
  networkListType: yup.string().oneOf(networkListTypeOptions.map((option) => option.value)),
  itemsValues: yup
    .string()
    .when('networkListType', {
      is: 'asn',
      then: (schema) => schema.required('ASN is a required field')
    })
    .when('networkListType', {
      is: 'ip_cidr',
      then: (schema) => schema.required('IP/CIDR is a required field')
    })
    .when('networkListType', {
      is: (networkListType) => networkListType !== 'countries',
      then: (schema) =>
        schema.test(
          'no-empty-lines',
          'There must be no empty lines or lines with only whitespace',
          (value) => {
            if (typeof value !== 'string' || !value) {
              return true
            }
            return value.split('\n').every((line) => line.trim() !== '')
          }
        )
    }),
  itemsValuesCountry: yup.array().when('networkListType', {
    is: 'countries',
    then: (schema) =>
      schema.required('Countries is a required field').min(1, 'Select at least one country')
  })
})
