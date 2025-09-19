const MAPLAYER = {
  'Edge Cache': 'cache',
  'Tiered Cache': 'tiered_cache'
}

export const PurgeAdapter = {
  transformCreatePurge(payload) {
    let argumentsPurge = payload.argumentsPurge
    const isArray = Array.isArray(payload.argumentsPurge)
    if (!isArray) {
      argumentsPurge = payload.argumentsPurge.trim().split('\n')
    }

    const layer = MAPLAYER[payload.layer] || payload.layer

    const request = {
      items: argumentsPurge,
      layer
    }

    return request
  }
}
