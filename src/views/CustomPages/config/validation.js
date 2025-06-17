import * as yup from 'yup'
import { STATUS_CODE_OPTIONS } from './statusCode'

const isUriValidRegex = /^\/[/a-zA-Z0-9\-_.~@:]*$/

const pageSchema = yup.object().shape({
  code: yup.string().required().label('Code'),
  type: yup.string().required().label('Type'),
  connector: yup.number().when('$type', {
    is: 'Connector',
    then: (schema) => schema.required().label('Connector'),
    otherwise: (schema) => schema.nullable()
  }),
  ttl: yup.number().when('$type', {
    is: 'Connector',
    then: (schema) => schema.required().label('TTL'),
    otherwise: (schema) => schema.nullable()
  }),
  uri: yup.string().when('$type', {
    is: 'Connector',
    then: (schema) =>
      schema
        .transform((value) => (value === '' ? null : value))
        .nullable()
        .matches(isUriValidRegex, 'Invalid URI')
        .default(null)
        .label('URI'),
    otherwise: (schema) => schema.nullable()
  }),
  contentType: yup.string().when('$type', {
    is: 'PageDefault',
    then: (schema) => schema.default('text/html').label('Content Type'),
    otherwise: (schema) => schema.nullable()
  }),
  response: yup.string().when('$type', {
    is: 'PageDefault',
    then: (schema) => schema.required().label('Response'),
    otherwise: (schema) => schema.nullable()
  }),
  customStatusCode: yup.string().nullable().default(null).label('Custom Status Code')
})

export const validationSchema = yup.object({
  id: yup.number(),
  name: yup.string().required().label('Name'),
  active: yup.boolean().required().label('Active'),
  pages: yup.array().of(pageSchema).required().label('Pages')
})

export const defaultValues = {
  name: '',
  active: false,
  pages: STATUS_CODE_OPTIONS
}
