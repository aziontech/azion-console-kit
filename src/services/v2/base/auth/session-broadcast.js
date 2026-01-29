import { BroadcastManager } from '../broadcast'

const sessionBroadcast = new BroadcastManager('session-sync')
sessionBroadcast.start()

export function sendLogoutBroadcast() {
  sessionBroadcast.send('LOGOUT')
}

export function sendSwitchAccountBroadcast() {
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
