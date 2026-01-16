import { BroadcastManager } from '../broadcast'
import { logger } from '../logger'

const sessionBroadcast = new BroadcastManager('session-sync')
sessionBroadcast.start()

export function sendLogoutBroadcast() {
  logger.log('SessionBroadcast', 'Sending logout broadcast to other tabs')
  sessionBroadcast.send('LOGOUT')
}

export function sendSwitchAccountBroadcast() {
  logger.log('SessionBroadcast', 'Sending switchAccount broadcast to other tabs')
  sessionBroadcast.send('SWITCH_ACCOUNT')
}

export function onLogout(callback) {
  sessionBroadcast.on('LOGOUT', callback)
}

export function onSwitchAccount(callback) {
  sessionBroadcast.on('SWITCH_ACCOUNT', callback)
}

export function stopSessionBroadcast() {
  sessionBroadcast.close()
}
