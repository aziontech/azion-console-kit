import { sanitizeHtml } from '@/helpers/sanitize-html'

export const DeviceGroupAdapter = {
  transformPayload(payload) {
    return {
      name: sanitizeHtml(payload.name),
      user_agent: payload.userAgent
    }
  },
  transformListDeviceGroup(data) {
    return (
      data?.map((deviceGroup) => {
        return {
          id: deviceGroup.id,
          deviceId: {
            content: deviceGroup.id
          },
          name: sanitizeHtml(deviceGroup.name),
          userAgent: sanitizeHtml(deviceGroup.user_agent)
        }
      }) || []
    )
  },
  transformLoadDeviceGroup({ data }) {
    return {
      id: data.id,
      name: sanitizeHtml(data.name),
      userAgent: data.user_agent
    }
  }
}
