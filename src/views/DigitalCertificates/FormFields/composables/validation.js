import * as yup from 'yup'

const CERTIFICATE_TYPES = {
  EDGE_CERTIFICATE_UPLOAD: 'edge_certificate',
  EDGE_CERTIFICATE_CSR: 'generateCSR',
  TRUSTED: 'trusted_ca_certificate',
  CERTIFICATE_REVOCATION_LIST: 'certificateRevogationList'
}

const CSRConditionalValidations = {
  is: CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR,
  then: (schema) => schema.required('Field Required')
}

const certificateRequiredField = (certificateType) => {
  return certificateType === CERTIFICATE_TYPES.TRUSTED
}

const validationSchema = yup.object({
  digitalCertificateName: yup.string().required('Name is a required field.'),
  certificateType: yup.string().required('Choose a certificate type.'),
  certificate: yup.string().when(['certificateType'], {
    is: certificateRequiredField,
    then: (schema) => schema.required('Certificate is a required field.')
  }),
  privateKey: yup.string(),
  common: yup.string().when('certificateType', CSRConditionalValidations),
  country: yup.string().when('certificateType', {
    is: CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR,
    then: (schema) =>
      schema
        .required('Country/Region is a required field.')
        .max(2, 'Country/Region must be a 2-character country code.')
        .min(2, 'Country/Region must be a 2-character country code.')
  }),
  state: yup.string().when('certificateType', CSRConditionalValidations),
  city: yup.string().when('certificateType', CSRConditionalValidations),
  organizationUnity: yup
    .string()
    .when('certificateType', CSRConditionalValidations)
    .label('organization unity'),
  organization: yup.string().when('certificateType', CSRConditionalValidations),
  privateKeyType: yup
    .string()
    .when('certificateType', CSRConditionalValidations)
    .label('private key type'),
  email: yup.string().when('certificateType', {
    is: CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR,
    then: (schema) => schema.required('Email is a required field.').email()
  }),
  subjectAlternativeNames: yup
    .string()
    .when('certificateType', CSRConditionalValidations)
    .label('subject alternative names (SAN)')
})

export { validationSchema }
