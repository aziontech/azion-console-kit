import * as yup from 'yup'

const isUriValidRegex = /^\/[/a-zA-Z0-9\-_.~@:]*$/

export const pageSchema = yup.object().shape({
  code: yup.object().shape({
    value: yup.string().required().label('Code')
  }),
  type: yup.string().required().label('Type'),
  connector: yup.number().when('type', {
    is: 'PageConnector',
    then: (schema) => schema.required().label('Connector'),
    otherwise: (schema) => schema.nullable()
  }),
  ttl: yup.number().when('type', {
    is: 'PageConnector',
    then: (schema) => schema.required().min(0).max(31536000).label('TTL'),
    otherwise: (schema) => schema.nullable()
  }),
  uri: yup.string().when('type', {
    is: 'PageConnector',
    then: (schema) =>
      schema
        .required()
        .transform((value) => (value === '' ? null : value))
        .matches(isUriValidRegex, 'Invalid URI')
        .default(null)
        .label('URI'),
    otherwise: (schema) => schema.nullable()
  }),
  contentType: yup.string().when('type', {
    is: 'PageDefault',
    then: (schema) => schema.default('text/html').label('Content Type'),
    otherwise: (schema) => schema.nullable()
  }),
  response: yup.string().when('type', {
    is: 'PageDefault',
    then: (schema) => schema.required().label('Response'),
    otherwise: (schema) => schema.nullable()
  }),
  customStatusCode: yup.number().when('type', {
    is: 'PageConnector',
    then: (schema) => schema.required().min(100).max(599).default(null).label('Custom Status Code'),
    otherwise: (schema) => schema.nullable()
  })
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
