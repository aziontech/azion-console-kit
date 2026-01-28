import * as Sentry from '@sentry/vue'
import { useRouter } from 'vue-router'

const STORAGE_KEY = 'azion:chunk-reload-state'
const MAX_RELOAD_ATTEMPTS = 2
const RELOAD_COOLDOWN_MS = 10_000

function getReloadState() {
  try {
    const state = sessionStorage.getItem(STORAGE_KEY)
    return state ? JSON.parse(state) : null
  } catch {
    return null
  }
}

function setReloadState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearReloadState() {
  sessionStorage.removeItem(STORAGE_KEY)
}

function canAttemptReload(targetPath) {
  const state = getReloadState()

  if (!state) {
    return { allowed: true }
  }

  const timeSinceLastAttempt = Date.now() - state.lastAttempt
  const isSamePath = state.path === targetPath

  if (!isSamePath) {
    clearReloadState()
    return { allowed: true }
  }

  if (timeSinceLastAttempt < RELOAD_COOLDOWN_MS) {
    return {
      allowed: false,
      reason: `Reload attempted ${timeSinceLastAttempt}ms ago, cooldown is ${RELOAD_COOLDOWN_MS}ms`
    }
  }

  if (state.attempts >= MAX_RELOAD_ATTEMPTS) {
    return {
      allowed: false,
      reason: `Max reload attempts (${MAX_RELOAD_ATTEMPTS}) exceeded for path: ${targetPath}`
    }
  }

  return { allowed: true }
}

function recordReloadAttempt(targetPath) {
  const state = getReloadState()
  const isSamePath = state?.path === targetPath

  setReloadState({
    attempts: isSamePath ? (state?.attempts || 0) + 1 : 1,
    lastAttempt: Date.now(),
    path: targetPath
  })
}

function reportToSentry(error, targetPath, willReload, blockReason) {
  const state = getReloadState()

  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'chunk_preload_error')
    scope.setTag('will_reload', willReload)
    scope.setTag('target_path', targetPath)

    scope.setContext('chunk_error_details', {
      targetPath,
      willReload,
      blockReason: blockReason || null,
      reloadAttempts: state?.attempts || 0,
      lastAttemptTimestamp: state?.lastAttempt || null,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href
    })

    scope.setLevel(willReload ? 'warning' : 'error')

    Sentry.captureException(error, {
      fingerprint: ['chunk-preload-error', targetPath]
    })
  })
}

function isValidRedirectPath(path) {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false
  }

  if (path.includes('://') || path.toLowerCase().startsWith('javascript:')) {
    return false
  }

  try {
    const decoded = decodeURIComponent(path)
    if (decoded.startsWith('//') || decoded.includes('://')) {
      return false
    }
  } catch {
    return false
  }

  return true
}

function joinPath(base, path) {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export function useChunkPreloadErrorHandler() {
  const router = useRouter()
  const chunkErrors = new Set()

  router.beforeEach(() => {
    chunkErrors.clear()
  })

  window.addEventListener('vite:preloadError', (event) => {
    chunkErrors.add(event.payload)
    event.preventDefault()
  })

  router.onError((error, to) => {
    if (!chunkErrors.has(error)) {
      return
    }

    const targetPath = joinPath(import.meta.env.BASE_URL || '/', to.fullPath)
    const { allowed, reason } = canAttemptReload(targetPath)

    reportToSentry(error, targetPath, allowed, reason)

    if (!allowed) {
      return
    }

    if (!isValidRedirectPath(targetPath)) {
      Sentry.captureMessage('Invalid redirect path detected in chunk error handler', {
        level: 'warning',
        extra: { targetPath }
      })
      window.location.reload()
      return
    }

    recordReloadAttempt(targetPath)

    if (window.location.pathname !== targetPath) {
      window.location.assign(targetPath)
    } else {
      window.location.reload()
    }
  })

  return {
    clearErrorState: clearReloadState
  }
}
