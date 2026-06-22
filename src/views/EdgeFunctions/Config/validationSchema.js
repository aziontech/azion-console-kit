import * as yup from 'yup'

// Shared Edge Function form schema, reused by the legacy EditView and the v6
// VersionShell adapter so both validate the same fields.
export const validationSchema = yup.object({
  name: yup.string().required('Name is a required field'),
  code: yup.string().required('Code is a required field'),
  azionForm: yup.object(),
  defaultArgs: yup.string().test('validJson', 'Invalid JSON', (value) => {
    let isValidJson = true
    try {
      JSON.parse(value)
    } catch {
      isValidJson = false
    }
    return isValidJson
  }),
  active: yup.boolean(),
  runtime: yup.string(),
  runtimeFormat: yup.object().nullable(),
  executionEnvironment: yup.string(),
  isProprietaryCode: yup.boolean()
})
