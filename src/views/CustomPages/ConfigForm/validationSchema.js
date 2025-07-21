import * as yup from 'yup'

const isUriValidRegex = /^\/[/a-zA-Z0-9\-_.~@:]*$/

export const pageSchema = yup.object().shape({
  code: yup.object().shape({
    value: yup.string().required().label('Code')
  }),
  type: yup.string().required().label('Type'),
  connector: yup.number().when('type', {
    is: 'page_connector',
    then: (schema) => schema.required().label('Connector'),
    otherwise: (schema) => schema.nullable()
  }),
  ttl: yup.number().default(0).min(0).max(31536000).label('TTL'),
  uri: yup
    .string()
    .transform((value) => (value === '' ? null : value))
    .matches(isUriValidRegex, 'Invalid URI')
    .nullable()
    .label('URI'),
  contentType: yup.string().when('type', {
    is: 'page_default',
    then: (schema) => schema.default('text/html').label('Content Type'),
    otherwise: (schema) => schema.nullable()
  }),
  response: yup.string().when('type', {
    is: 'page_default',
    then: (schema) => schema.required().label('Response'),
    otherwise: (schema) => schema.nullable()
  }),
  customStatusCode: yup.number().min(100).max(599).nullable().label('Custom Status Code')
})

export const validationSchema = yup.object({
  id: yup.number(),
  name: yup.string().required().label('Name'),
  active: yup.boolean().required().label('Active'),
  pages: yup
    .array()
    .of(pageSchema)
    .test('at-least-one-page-with-code', 'You must have at least one custom page code', (pages) =>
      pages.some((page) => page.code.value !== '')
    )
    .required()
    .label('Pages')
})

export const defaultValues = {
  name: '',
  active: true,
  pages: []
}
