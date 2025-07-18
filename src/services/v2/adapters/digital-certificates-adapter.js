import { getCurrentTimezone, checkIfFieldExist, getCurrentDateTimeIntl } from '@/helpers'
import { parseStatusData } from '@/services/v2/utils/adapter/parse-status-utils'

const EDGE_CERTIFICATE = 'TLS Certificate'
const TRUSTED_CA_CERTIFICATE = 'Trusted CA Certificate'

export const DigitalCertificatesAdapter = {
  transformCreateDigitalCertificate({
    digitalCertificateName,
    certificateType,
    certificate,
    privateKey
  }) {
    return {
      name: digitalCertificateName,
      type: certificateType,
      ...(!!certificate?.trim() && { certificate }),
      ...(!!privateKey?.trim() && { private_key: privateKey })
    }
  },

  transformCreateDigitalCertificateLetEncrypt(payload, sourceCertificate) {
    const payloadRequest = {
      name: `Let's Encrypt - ${payload.name} - ${getCurrentDateTimeIntl()}`,
      certificate: null,
      private_key: null,
      type: 'edge_certificate',
      challenge: 'dns',
      authority: 'lets_encrypt',
      key_algorithm: 'rsa_2048',
      active: true,
      common_name: payload.letEncrypt.commonName,
      alternative_names: payload.letEncrypt.alternativeNames
    }

    if (sourceCertificate) {
      payloadRequest.source_certificate = sourceCertificate
    }

    return payloadRequest
  },

  transformListDigitalCertificates({ results, count }) {
    const formattedResults = results?.map((item) => {
      let subjectName = []
      const typeMap = {
        edge_certificate: EDGE_CERTIFICATE,
        trusted_ca_certificate: TRUSTED_CA_CERTIFICATE
      }

      if (item.subject_name && item.subject_name.length) {
        if (item.subject_name[0].includes(',')) {
          subjectName = item.subject_name[0].split(',')
        } else {
          subjectName = item.subject_name
        }
      }

      return {
        id: checkIfFieldExist(item?.id, null),
        name: checkIfFieldExist(item?.name),
        issuer: checkIfFieldExist(item?.issuer),
        subjectName,
        type: checkIfFieldExist(typeMap[item?.type]),
        validity: item?.validity ? getCurrentTimezone(item.validity) : '-',
        status: {
          status: parseStatusData(item.status),
          statusDetail: item?.status_detail
        }
      }
    })

    return {
      count: count || 0,
      body: formattedResults || []
    }
  },

  transformListDigitalCertificatesDropdown({ results, count }, { type, search }) {
    let parsedDigitalCertificates = results.map((item) => {
      return {
        id: item.id,
        name: item.name,
        authority: item?.authority,
        status: item?.status,
        group: 'My certificates'
      }
    })

    if (type === 'edge_certificate') {
      const DEFAULT_CERTIFICATES = [
        { id: 0, name: 'Azion (SAN)', status: 'active', group: 'Certificates presets' },
        { id: 1, name: "Let's Encrypt", status: 'active', group: 'Certificates presets' }
      ]
      const searchLowercase = search?.toLowerCase()
      const matchesSearch = (cert) => cert.name.toLowerCase().includes(searchLowercase)

      const filteredDefaultCertificates = searchLowercase
        ? DEFAULT_CERTIFICATES.filter(matchesSearch)
        : DEFAULT_CERTIFICATES

      parsedDigitalCertificates = [...filteredDefaultCertificates, ...parsedDigitalCertificates]
      count += filteredDefaultCertificates.length
    }

    return {
      count: count || 0,
      body: parsedDigitalCertificates || []
    }
  },

  transformLoadDigitalCertificate({ data }) {
    const {
      id,
      name,
      type,
      csr,
      managed,
      issuer,
      subject_name,
      validity,
      status,
      certificate_type,
      certificate_content,
      certificate,
      authority
    } = data

    return {
      id,
      name,
      type,
      csr: csr ?? undefined,
      managed,
      issuer,
      subjectName: subject_name,
      validity,
      status,
      certificateType: certificate_type,
      certificateContent: certificate_content,
      certificate,
      authority
    }
  },

  transformEditDigitalCertificate({ name, certificate, privateKey }) {
    return {
      name,
      certificate: certificate || undefined,
      private_key: privateKey || undefined
    }
  }
}
