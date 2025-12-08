import { checkIfFieldExist } from '@/helpers'
import { parseStatusData } from '@/services/v2/utils/adapter/parse-status-utils'
import { convertToRelativeTime } from '@/helpers/convert-date'

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
        lastModified: item?.last_modified ? item.last_modified : '-',
        lastModify: item?.last_modified ? convertToRelativeTime(item.last_modified) : '-'
      }
    })

    return formattedResults
  },

  transformListDigitalCertificatesCRLDropwdown(data) {
    return data?.map((item) => {
      return {
        id: checkIfFieldExist(item?.id, null),
        name: checkIfFieldExist(item?.name),
        status: item?.status
      }
    })
  },

  transformLoadDigitalCertificateCRL({ data }) {
    return {
      id: data?.id,
      name: data?.name,
      certificate: data?.crl,
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
