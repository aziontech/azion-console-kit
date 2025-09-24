import { CACHE_TYPE } from '@/services/v2/base/query/config'

export const globalKey = (segments = []) => [CACHE_TYPE.GLOBAL, ...segments]
export const sensitiveKey = (segments = []) => [CACHE_TYPE.SENSITIVE, ...segments]

export const isSensitiveKey = (key = []) => key?.[0] === CACHE_TYPE.SENSITIVE
export const isGlobalKey = (key = []) => key?.[0] === CACHE_TYPE.GLOBAL
