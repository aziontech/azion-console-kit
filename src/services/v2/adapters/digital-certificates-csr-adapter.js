export const DigitalCertificatesCSRAdapter = {
  transformCreateDigitalCertificateCSR({
    digitalCertificateName,
    common,
    city,
    state,
    country,
    organization,
    email,
    organizationUnity,
    subjectAlternativeNames
  }) {
    return {
      name: digitalCertificateName,
      common_name: common,
      locality: city,
      state,
      country,
      organization,
      email,
      organization_unity: organizationUnity,
      private_key_type: 'rsa_2048',
      alternative_names: subjectAlternativeNames ? subjectAlternativeNames?.split('\n') : []
    }
  }
}
