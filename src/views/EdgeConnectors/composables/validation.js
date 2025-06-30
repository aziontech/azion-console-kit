import * as yup from 'yup'

const validationSchema = yup.object({
  name: yup.string().required('Name is a required field.'),
  type: yup.string().required('Connection Type is a required field.'),
  attributes: yup.object({
    connectionOptions: yup.object({
      dnsResolution: yup.boolean().required('DNS Resolution is a required field.'),
      transportPolicy: yup.string().required('Transport Policy is a required field.'),
      host: yup.string().required('Host is a required field.'),
      pathPrefix: yup.string(),
      realIpHeader: yup.string().required('Real IP Header is a required field.'),
      realPortHeader: yup.string().required('Real Port Header is a required field.'),
      followingRedirect: yup.boolean(),
    }),
    modules: yup.object({
      loaderBalancer: yup.object({
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
            enabled: yup.boolean(),
            config: yup.object({
              certificate: yup.number().required('Certificate is a required field.'),
              crl: yup.array().of(yup.number()),
            })
          }).when('enabled', {
            is: true,
            then: yup.object().required('MTLS is a required field.'),
            otherwise: yup.object().notRequired(),
          }),
          hmac: yup.object({
            enabled: yup.boolean(),
            type: yup.string().required('Type is a required field.'),
            attributes: yup.object({
              region: yup.string().required('Region is a required field.'),
              service: yup.string().required('Service is a required field.'),
              accessKey: yup.string().required('Access Key is a required field.'),
              secretKey: yup.string().required('Secret Key is a required field.'),
            })
          }).when('enabled', {
            is: true,
            then: yup.object().required('HMAC is a required field.'),
            otherwise: yup.object().notRequired(),
          })
        })
      }),
    }),
    addresses: yup.mixed().when('loaderBalancer.enabled', {
      is: true,
      then: yup.array().of(
        yup.object({
          active: yup.boolean(),
          address: yup.string().required('Address is a required field.'),
          httpPort: yup.number().required('Http Port is a required field.'),
          httpsPort: yup.number().required('Https Port is a required field.'),
        })
      ).required('Addresses are required when load balancer is enabled.'),
      otherwise: yup.mixed().notRequired().strip()
    }),
    address: yup.mixed().when('loaderBalancer.enabled', {
      is: false,
      then: yup.object({
        address: yup.string().required('Address is a required field.'),
        tlsPort: yup.number().notRequired(),
        plainPort: yup.number().notRequired(),
      }).required('Address is required when load balancer is disabled.'),
      otherwise: yup.mixed().notRequired().strip()
    })
  }),
})

export { validationSchema }
