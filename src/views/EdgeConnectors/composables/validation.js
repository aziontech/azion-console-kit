import * as yup from 'yup'

const validationSchema = yup.object({
  name: yup.string().required('Name is a required field.'),
  type: yup.string().required('Connection Type is a required field.'),
  connectionOptions: yup.object().when('type', ([type], schema) => {
    switch (type) {
      case 'http':
        return schema.shape({
          dnsResolution: yup.string(),
          transportPolicy: yup.string(),
          host: yup.string().required('Host is a required field.'),
          pathPrefix: yup.string(),
          realIpHeader: yup.string(),
          realPortHeader: yup.string(),
          followingRedirect: yup.boolean(),
        })
      case 'edge_storage':
        return schema.shape({
          bucket: yup.string().required('Bucket is a required field.'),
          prefix: yup.string().required('Prefix is a required field.'),
        })
      case 'live_ingest':
        return schema.shape({
          region: yup.string().required('Region is a required field.'),
        })
      default:
        return schema
    }
  }),
  modules: yup.object({
    loadBalancer: yup.object({
      enabled: yup.boolean(),
      config: yup.object({
        method: yup.string(),
        maxRetries: yup.number(),
        connectionTimeout: yup.number(),
        readWriteTimeout: yup.number()
      }),
    }),
    originShield: yup.object({
      enabled: yup.boolean(),
      config: yup.object({
        originIpAcl: yup.boolean(),
        mtls: yup.object({
          active: yup.boolean(),
          config: yup.object({
            certificate: yup.number().nullable(),
            crl: yup.array().of(yup.number()),
          })
        }),
        hmac: yup.object({
          active: yup.boolean(),
          type: yup.string(),
          attributes: yup.object({
            region: yup.string(),
            service: yup.string(),
            accessKey: yup.string(),
            secretKey: yup.string(),
          })
        })
      })
    }),
  }),
  loadBalancerConfiguration: yup.object({
    method: yup.string(),
    maxRetries: yup.number(),
    connectionTimeout: yup.number(),
    readWriteTimeout: yup.number()
  }),
  addresses: yup.array().of(
    yup.object({
      address: yup.string().required('Address is a required field.'),
      plainPort: yup.number(),
      tlsPort: yup.number(),
      serverRole: yup.string(),
      maxConns: yup.number(),
      weight: yup.number(),
      maxFails: yup.number(),
      failTimeout: yup.number(),
      active: yup.boolean(),
    })
  ),
  address: yup.object({
    address: yup.string().required('Address is a required field.'),
    tlsPort: yup.number(),
    plainPort: yup.number(),
  }).when(['modules.loadBalancer.enabled'], ([isLoadBalancerEnabled], schema) => {
    return !isLoadBalancerEnabled ? schema.required() : schema.notRequired().strip()
  }),
  originIpAcl: yup.boolean(),
  // mtls: yup.object({
  //   active: yup.boolean(),
  //   config: yup.object({
  //     certificate: yup.number().nullable(),
  //     crl: yup.array().of(yup.number()),
  //   })
  // }),
  hmac: yup.object().when(['modules.originShield.enabled'], ([isOriginShieldEnabled], schema) => {
    if (!isOriginShieldEnabled) return schema.strip()

    return yup.object({
      active: yup.boolean(),
      type: yup.string().when('active', {
        is: true,
        then: (schema) => schema.required('Type is a required field.'),
        otherwise: (schema) => schema.notRequired().strip()
      }),
      attributes: yup.object({
        region: yup.string().required('Region is a required field.'),
        service: yup.string().required('Service is a required field.'),
        accessKey: yup.string().required('Access Key is a required field.'),
        secretKey: yup.string().required('Secret Key is a required field.'),
      }).when('active', {
        is: true,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.strip()
      })
    })
  })
})

export { validationSchema }
