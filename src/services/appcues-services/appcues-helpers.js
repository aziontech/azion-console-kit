import { appcuesService } from './appcues-service'

export const fetchTags = async () => {
  try {
    return await appcuesService.getTags()
  } catch {
    return []
  }
}

export const fetchLaunchpads = async () => {
  try {
    return await appcuesService.getLaunchpads()
  } catch {
    return []
  }
}

export const findTagIdByName = (tags, tagName) => {
  const tag = tags.find((t) => t.name === tagName)
  return tag?.id || null
}

export const filterLaunchpadsByTagId = (launchpads, tagId) => {
  return launchpads.filter((lp) => lp.tag_ids?.includes(tagId))
}
