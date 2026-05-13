import { onSwitchAccount } from '@/services/v2/base/auth/session-broadcast'

const isLoginPage = () => window.location.pathname === '/login'

function getClientIdFromJson(jsonString) {
  if (!jsonString) return null
  try {
    return JSON.parse(jsonString)?.client_id ?? null
  } catch {
    return null
  }
}

window.addEventListener('storage', (event) => {
  if (event.key !== '__user_traits') return

  const newClientId = getClientIdFromJson(event.newValue)
  const oldClientId = getClientIdFromJson(event.oldValue)

  if (!newClientId || !oldClientId) return
  if (newClientId === oldClientId) return

  window.location.assign(isLoginPage() ? '/' : window.location.href)
})

onSwitchAccount(() => {
  if (isLoginPage()) {
    window.location.assign('/')
    return
  }

  window.location.reload()
})
