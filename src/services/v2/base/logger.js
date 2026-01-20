import { isProduction } from '@/helpers/get-environment'

const isEnabled = !isProduction()

export const logger = {
  log(prefix, ...args) {
    if (isEnabled) {
      // eslint-disable-next-line no-console
      console.log(`[${prefix}]`, ...args)
    }
  },

  error(prefix, ...args) {
    if (isEnabled) {
      // eslint-disable-next-line no-console
      console.error(`[${prefix}]`, ...args)
    }
  },

  warn(prefix, ...args) {
    if (isEnabled) {
      // eslint-disable-next-line no-console
      console.warn(`[${prefix}]`, ...args)
    }
  },
  info(prefix, ...args) {
    if (isEnabled) {
      // eslint-disable-next-line no-console
      console.info(`[${prefix}]`, ...args)
    }
  }
}
