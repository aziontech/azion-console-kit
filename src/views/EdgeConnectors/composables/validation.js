import * as yup from 'yup'

const validationSchema = yup.object({
  name: yup.string().required().label('Name'),
  type: yup.string().required().label('Connection Type'),
  active: yup.boolean(),
  connectionOptions: yup.object().when('type', ([type], schema) => {
    switch (type) {
      case 'http':
        return schema.shape({
          dnsResolution: yup.string(),
          transportPolicy: yup.string(),
          host: yup.string(),
          path: yup
            .string()
            .test('starts-with-slash', 'Path must start with a forward slash (/)', (value) => {
              if (value === null || value === undefined || value === '') {
                return true
              }
              return value.startsWith('/')
            }),
          realIpHeader: yup.string(),
          realPortHeader: yup.string(),
          followingRedirect: yup.boolean()
        })
      case 'edge_storage':
        return schema.shape({
          bucket: yup.string().required().label('Bucket'),
          prefix: yup.string().label('Prefix')
        })
      case 'live_ingest':
        return schema.shape({
          region: yup.string().required().label('Region')
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
            method: yup.string().label('Method'),
            maxRetries: yup.number().min(0).max(20).label('Max Retries'),
            connectionTimeout: yup.number().min(1).max(300).label('Connection Timeout'),
            readWriteTimeout: yup.number().min(1).max(600).label('Read/Write Timeout')
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
              enabled: yup.boolean().label('Origin IP ACL')
            }),
            hmac: yup.object({
              enabled: yup.boolean().label('HMAC'),
              config: yup.object().when('enabled', {
                is: true,
                then: (schema) =>
                  schema.shape({
                    type: yup.string().required().label('Type'),
                    attributes: yup.object({
                      region: yup.string().required().label('Region'),
                      service: yup.string().required().label('Service'),
                      accessKey: yup.string().required().label('Access Key'),
                      secretKey: yup.string().required().label('Secret Key')
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
  addresses: yup.array().when('type', {
    is: 'http',
    then: (schema) =>
      schema.of(
        yup.object({
          address: yup.string().required().label('Address'),
          httpPort: yup.number().min(1).max(65535).label('HTTP Port'),
          httpsPort: yup.number().min(1).max(65535).label('HTTPS Port'),
          serverRole: yup.string().label('Server Role'),
          weight: yup.number().min(1).max(100).label('Weight'),
          active: yup.boolean().label('Active')
        })
      ),
    otherwise: (schema) => schema.strip()
  })
})

export { validationSchema }
