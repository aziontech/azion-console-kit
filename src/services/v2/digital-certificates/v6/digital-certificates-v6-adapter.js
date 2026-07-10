import { getCurrentTimezone, checkIfFieldExist } from '@/helpers'
import { parseStatusString } from '@/services/v2/utils/adapter/parse-status-utils'
import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { transformVersionsList } from './versions-adapter'

const EDGE_CERTIFICATE = 'TLS Certificate'
const TRUSTED_CA_CERTIFICATE = 'Trusted CA Certificate'

const statusExpired = { content: 'Expired', severity: 'danger' }

const unwrap = (data) => data?.data ?? data

const isValidityDateExpired = (validityDate) => {
  if (!validityDate) return false

  try {
    const expirationDate = new Date(validityDate)
    const currentDate = new Date()

    return !isNaN(expirationDate.getTime()) && expirationDate < currentDate
  } catch (error) {
    return false
  }
}

const mapRow = (item) => {
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

  const isExpired = isValidityDateExpired(item?.validity)
  const originalStatus = parseStatusString(item.status)
  const finalStatus = isExpired ? statusExpired : originalStatus

  return {
    id: checkIfFieldExist(item?.id, null),
    name: checkIfFieldExist(item?.name),
    issuer: checkIfFieldExist(item?.issuer),
    subjectName: subjectName.length ? subjectName : '-',
    type: checkIfFieldExist(typeMap[item?.type]),
    validity: item?.validity ? getCurrentTimezone(item.validity) : '-',
    challenge: checkIfFieldExist(item?.challenge),
    authority: checkIfFieldExist(item?.authority),
    keyAlgorithm: checkIfFieldExist(item?.key_algorithm),
    lastEditor: checkIfFieldExist(item?.last_editor),
    lastModified: item?.last_modified ? formatDateToDayMonthYearHour(item.last_modified) : '-',
    lastModify: item?.last_modified ? convertToRelativeTime(item.last_modified) : '-',
    managed: item?.managed,
    status: {
      status: finalStatus,
      statusDetail: item?.status_detail
    }
  }
}

export const DigitalCertificatesV6Adapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map(mapRow)
  },

  transformLoadItem(data) {
    const { id, name, type, managed, csr } = unwrap(data) ?? {}

    return {
      id,
      name,
      type,
      managed,
      csr: csr ?? undefined,
      certificate: '',
      privateKey: undefined
    }
  },

  transformCreatePayload({ digitalCertificateName, certificateType, certificate, privateKey }) {
    return {
      name: digitalCertificateName,
      type: certificateType,
      ...(!!certificate?.trim() && { certificate }),
      ...(!!privateKey?.trim() && { private_key: privateKey })
    }
  },

  transformEditPayload({ name, type, certificate, privateKey }) {
    return {
      name,
      type,
      ...(!!certificate?.trim() && { certificate }),
      ...(!!privateKey?.trim() && { private_key: privateKey })
    }
  },

  transformVersionsList
}
