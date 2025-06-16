import * as yup from 'yup'

const isUriValidRegex = /^\/[/a-zA-Z0-9\-_.~@:]*$/

const pageConnectorSchema = yup.object().shape({
  type: yup.string().equals(['PageConnector']).required(),
  attributes: yup
    .object()
    .shape({
      connector: yup.number().required().label('Connector'),
      ttl: yup.number().min(0).default(0).label('TTL'),
      uri: yup
        .string()
        .transform((value) => (value === '' ? null : value))
        .nullable()
        .matches(isUriValidRegex, 'Invalid URI')
        .default(null)
        .label('URI'),
      custom_status_code: yup.number().nullable().default(null).label('Custom Status Code')
    })
    .required()
})

const pageDefaultSchema = yup.object().shape({
  type: yup.string().equals(['PageDefault']).required(),
  attributes: yup
    .object()
    .shape({
      content_type: yup.string().default('text/html').label('Content Type'),
      response: yup.string().required().label('Response'),
      custom_status_code: yup.number().nullable().default(null).label('Custom Status Code')
    })
    .required()
})

export const validationSchema = yup.object({
  id: yup.number(),
  name: yup.string().required().label('Name'),
  active: yup.boolean().required().label('Active'),
  pages: yup
    .array()
    .of(
      yup.object().shape({
        code: yup.string().required().label('Code'),
        page: yup.lazy((value) => {
          return value?.type === 'PageConnector' ? pageConnectorSchema : pageDefaultSchema
        })
      })
    )
    .required()
    .label('Pages')
})

export const defaultValues = {
  name: '',
  active: false,
  pages: []
}
