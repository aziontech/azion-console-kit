import * as yup from 'yup'

const CERTIFICATE_TYPES = {
  EDGE_CERTIFICATE_UPLOAD: 'edge_certificate',
  EDGE_CERTIFICATE_CSR: 'generateCSR',
  TRUSTED: 'trusted_ca_certificate',
  CERTIFICATE_REVOCATION_LIST: 'certificateRevogationList'
}

const CSRConditionalValidations = (fieldName) => ({
  is: CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR,
  then: (schema) => schema.required(`${fieldName} is a required field.`)
})

const certificateRequiredField = (isWorkloadCreation = false, certificateType) => {
  if (isWorkloadCreation) {
    return true
  }
  return certificateType === CERTIFICATE_TYPES.TRUSTED
}

const validationSchemaHandler = (isWorkloadCreation = false, certificateType) => {
  return yup.object({
    digitalCertificateName: yup.string().required('Name is a required field.'),
    certificateType: yup.string().required('Choose a certificate type.'),
    certificate: yup.string().when('certificateType', {
      is: () => certificateRequiredField(isWorkloadCreation, certificateType),
      then: (schema) => schema.required('Certificate is a required field.')
    }),
    privateKey: yup.string().when(['certificateType'], {
      is: () => certificateRequiredField(isWorkloadCreation),
      then: (schema) => schema.required('Private Key is a required field.')
    }),
    common: yup.string().when('certificateType', CSRConditionalValidations('Subject Name')),
    country: yup.string().when('certificateType', {
      is: CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR,
      then: (schema) =>
        schema
          .required('Country/Region is a required field.')
          .max(2, 'Country/Region must be a 2-character country code.')
          .min(2, 'Country/Region must be a 2-character country code.')
    }),
    state: yup.string().when('certificateType', CSRConditionalValidations('State/Province')),
    city: yup.string().when('certificateType', CSRConditionalValidations('City/Locality')),
    organizationUnity: yup
      .string()
      .when('certificateType', CSRConditionalValidations('Organization Unity'))
      .label('organization unity'),
    organization: yup.string().when('certificateType', CSRConditionalValidations('Organization')),
    privateKeyType: yup
      .string()
      .when('certificateType', CSRConditionalValidations('Private Key Type'))
      .label('private key type'),
    email: yup.string().when('certificateType', {
      is: CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR,
      then: (schema) => schema.required('Email is a required field.').email()
    }),
    subjectAlternativeNames: yup.string().label('subject alternative names (SAN)')
  })
}

export default validationSchemaHandler
