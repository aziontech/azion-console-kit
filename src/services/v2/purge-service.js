export class PurgeService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/workspace/purge'

    this.MAP_PURGE_TYPE = {
      CacheKey: 'cachekey',
      Wildcard: 'wildcard',
      URL: 'url'
    }
  }

  createPurge = async (data) => {
    const purgeType = this.MAP_PURGE_TYPE[data.purgeType] || data.purgeType
    const payload = this.adapter?.transformCreatePurge?.(data)

    await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${purgeType}`,
      body: payload
    })

    return {
      feedback: 'The purge is queued for execution. It’ll appear in the history once completed.',
      urlToEditView: `/real-time-purge`,
      params: {
        isPending: true
      }
    }
  }
}
