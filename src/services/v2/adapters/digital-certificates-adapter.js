import { capitalizeFirstLetter, getCurrentTimezone, checkIfFieldExist } from '@/helpers'

const parseStatusData = (status) => {
  if (!status) {
    return {
      content: '-',
      severity: 'info'
    }
  }

  const isActive = status.toUpperCase() === 'ACTIVE'
  const parsedStatus = isActive
    ? {
        content: capitalizeFirstLetter(status),
        severity: 'success'
      }
    : {
        content: capitalizeFirstLetter(status),
        severity: 'danger'
      }

  return parsedStatus
}

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

  transformListDigitalCertificates({ results, count }) {
    const formattedResults = results?.map((item) => {
      const subjectNames = checkIfFieldExist(
        item?.subject_name?.map((subject) => subject)?.join(',')
      )
      const typeMap = {
        edge_certificate: EDGE_CERTIFICATE,
        trusted_ca_certificate: TRUSTED_CA_CERTIFICATE
      }

      return {
        id: checkIfFieldExist(item?.id, null),
        name: checkIfFieldExist(item?.name),
        issuer: checkIfFieldExist(item?.issuer),
        subjectName: subjectNames,
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

  transformListDigitalCertificatesDropdown({ body, count }, { type, search }) {
    let parsedDigitalCertificates = body?.map((item) => {
      return {
        id: item.id,
        name: item.name
      }
    })

    if (type === 'edge_certificate') {
      const DEFAULT_CERTIFICATES = [{ id: 0, name: 'Azion (SAN)' }]
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
      certificate
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
      certificate
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
