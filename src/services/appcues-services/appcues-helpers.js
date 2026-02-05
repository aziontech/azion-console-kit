import appcuesApi from '../axios/makeAppcuesApi'

const ACCOUNT_ID = import.meta.env.VITE_APPCUES_ACCOUNT_ID

let cachedApi = null
let cachedTags = null
let cachedLaunchpads = null
let tagsPromise = null
let launchpadsPromise = null

export const getApi = () => {
  if (!cachedApi) {
    cachedApi = appcuesApi()
  }
  return cachedApi
}

export const getAccountId = () => {
  return ACCOUNT_ID
}

export const fetchTags = async (api) => {
  if (cachedTags) return cachedTags

  if (tagsPromise) return tagsPromise

  tagsPromise = api
    .get(`/accounts/${ACCOUNT_ID}/tags`)
    .then((response) => {
      cachedTags = response.data || []
      return cachedTags
    })
    .catch(() => {
      tagsPromise = null
      return []
    })

  return tagsPromise
}

export const fetchLaunchpads = async (api) => {
  if (cachedLaunchpads) return cachedLaunchpads

  if (launchpadsPromise) return launchpadsPromise

  launchpadsPromise = api
    .get(`/accounts/${ACCOUNT_ID}/launchpads`)
    .then((response) => {
      cachedLaunchpads = response.data || []
      return cachedLaunchpads
    })
    .catch(() => {
      launchpadsPromise = null
      return []
    })

  return launchpadsPromise
}

export const findTagIdByName = (tags, tagName) => {
  const tag = tags.find((item) => item.name === tagName)
  return tag?.id || null
}

export const filterLaunchpadsByTagId = (launchpads, tagId) => {
  return launchpads.filter((lp) => lp.tag_ids?.includes(tagId))
}
