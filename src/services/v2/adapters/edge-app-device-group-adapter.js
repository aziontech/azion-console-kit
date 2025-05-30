export const DeviceGroupAdapter = {
  transformPayload(payload) {
    return {
      name: payload.name,
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
          name: deviceGroup.name,
          userAgent: deviceGroup.user_agent
        }
      }) || []
    )
  },
  transformLoadDeviceGroup({ data }) {
    return {
      id: data.id,
      name: data.name,
      userAgent: data.user_agent
    }
  }
}
