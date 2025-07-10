import * as yup from 'yup'

const validationSchema = yup.object({
  name: yup.string().required('Name is a required field.'),
  type: yup.string().required('Connection Type is a required field.'),
  active: yup.boolean(),
  connectionOptions: yup.object().when('type', ([type], schema) => {
    switch (type) {
      case 'http':
        return schema.shape({
          dnsResolution: yup.string(),
          transportPolicy: yup.string(),
          host: yup.string(),
          pathPrefix: yup.string(),
          realIpHeader: yup.string(),
          realPortHeader: yup.string(),
          followingRedirect: yup.boolean()
        })
      case 'edge_storage':
        return schema.shape({
          bucket: yup.string().required('Bucket is a required field.'),
          prefix: yup.string()
        })
      case 'live_ingest':
        return schema.shape({
          region: yup.string().required('Region is a required field.')
        })
      default:
        return schema
    }
  }),
  modules: yup.object({
    loadBalancer: yup.object({
      enabled: yup.boolean(),
      config: yup.object().when('enabled', {
        is: true,
        then: (schema) =>
          schema.shape({
            method: yup.string(),
            maxRetries: yup.number(),
            connectionTimeout: yup.number(),
            readWriteTimeout: yup.number()
          }),
        otherwise: (schema) => schema.strip()
      })
    }),
    originShield: yup.object({
      enabled: yup.boolean(),
      config: yup.object().when('enabled', {
        is: true,
        then: (schema) =>
          schema.shape({
            originIpAcl: yup.object({
              enabled: yup.boolean()
            }),
            hmac: yup.object({
              enabled: yup.boolean(),
              config: yup.object().when('enabled', {
                is: true,
                then: (schema) =>
                  schema.shape({
                    type: yup.string().required('Type is a required field.'),
                    attributes: yup.object({
                      region: yup.string().required('Region is a required field.'),
                      service: yup.string().required('Service is a required field.'),
                      accessKey: yup.string().required('Access Key is a required field.'),
                      secretKey: yup.string().required('Secret Key is a required field.')
                    })
                  }),
                otherwise: (schema) => schema.strip()
              })
            })
          }),
        otherwise: (schema) => schema.strip()
      })
    })
  }),
  addresses: yup
    .array()
    .of(
      yup.object({
        address: yup.string().required('Address is a required field.'),
        plainPort: yup.number(),
        tlsPort: yup.number(),
        serverRole: yup.string(),
        weight: yup.number(),
        active: yup.boolean()
      })
    )
})

export { validationSchema }
