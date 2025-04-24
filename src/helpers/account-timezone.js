import { useAccountStore } from '@stores/account'

const convertValueToDateByUserTimezone = (time, timezone) => {
  const date = new Date(time)
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }
  return date.toLocaleString('en-US', options)
}

export const getCurrentTimezone = (time) => {
  const accountStore = useAccountStore()
  const { timezone } = accountStore.accountData

  const formatTime = convertValueToDateByUserTimezone(time, timezone)

  return formatTime
}
