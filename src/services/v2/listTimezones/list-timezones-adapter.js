export const adaptTimezones = (data) => {
  if (!data || !data.allTimezones) {
    throw new Error('Invalid data structure received from timezones API')
  }

  const timeZonesFormatted = data.allTimezones
    .map((item) => {
      const matchResult = item.match(/\(UTC ([+-]\d+:\d+)\) (.+)/)

      if (!matchResult) {
        return null
      }

      const [, utc, region] = matchResult

      return {
        label: item,
        value: region,
        utc: Number(utc.replace(':', ''))
      }
    })
    .filter(Boolean)
    .sort((timeA, timeB) => {
      if (timeA.utc !== timeB.utc) {
        return timeA.utc - timeB.utc
      }
      return timeA.value.localeCompare(timeB.value)
    })

  const timeZoneDefault = 'GMT'
  const defaultSelected = timeZonesFormatted.find((item) => item.value === timeZoneDefault)?.value

  return {
    defaultSelected,
    listTimeZones: timeZonesFormatted
  }
}
