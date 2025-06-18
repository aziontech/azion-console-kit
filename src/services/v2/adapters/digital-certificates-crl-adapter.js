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

export const DigitalCertificatesCRLAdapter = {
  transformCreateDigitalCertificateCRL(payload) {
    return {
      name: payload.digitalCertificateName,
      crl: payload.certificate,
      active: true
    }
  },

  transformListDigitalCertificatesCRL(results) {
    const formattedResults = results?.map((item) => {
      return {
        id: checkIfFieldExist(item?.id, null),
        name: checkIfFieldExist(item?.name),
        issuer: checkIfFieldExist(item?.issuer),
        status: {
          status: parseStatusData(item.active ? 'ACTIVE' : 'INACTIVE')
        },
        lastEditor: item?.last_editor || '-',
        lastModified: item?.last_modified ? getCurrentTimezone(item.last_modified) : '-'
      }
    })

    return formattedResults
  },

  transformLoadDigitalCertificateCRL({ data }) {
    return {
      id: data?.id,
      name: data?.name,
      certificate: data?.crl || undefined,
      type: 'CRL'
    }
  },

  transformEditDigitalCertificateCRL(payload) {
    return {
      name: payload.name,
      crl: payload.certificate
    }
  }
}
