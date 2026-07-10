import { checkIfFieldExist } from '@/helpers'
import { parseStatusData } from '@/services/v2/utils/adapter/parse-status-utils'
import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { transformVersionsList } from './versions-adapter'

const unwrap = (data) => data?.data ?? data

const mapRow = (item) => ({
  id: checkIfFieldExist(item?.id, null),
  name: checkIfFieldExist(item?.name),
  issuer: checkIfFieldExist(item?.issuer),
  status: {
    status: parseStatusData(item?.active)
  },
  lastEditor: item?.last_editor || '-',
  lastModified: item?.last_modified ? formatDateToDayMonthYearHour(item.last_modified) : '-',
  lastModify: item?.last_modified ? convertToRelativeTime(item.last_modified) : '-'
})

export const DigitalCertificatesCRLV6Adapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map(mapRow)
  },

  transformLoadItem(data) {
    const { id, name } = unwrap(data) ?? {}

    return {
      id,
      name,
      type: 'CRL',
      certificate: ''
    }
  },

  transformCreatePayload({ digitalCertificateName, certificate }) {
    return {
      name: digitalCertificateName,
      crl: certificate
    }
  },

  transformEditPayload({ name, certificate }) {
    return {
      name,
      ...(!!certificate?.trim() && { crl: certificate })
    }
  },

  transformVersionsList
}
