import * as yup from 'yup'

export const validationSchema = yup.object({
  name: yup.string().required().min(3).max(255).label('Name'),
  description: yup.string().nullable().default(''),
  binding_policy: yup.string().required().oneOf(['STRICT', 'FLEXIBLE']).label('Binding Policy'),
  deployment_policy: yup
    .string()
    .required()
    .oneOf(['single_version', 'versioned_urls'])
    .label('Deployment Version Policy')
})

export const initialValues = {
  name: '',
  description: '',
  binding_policy: 'STRICT',
  deployment_policy: 'single_version'
}
