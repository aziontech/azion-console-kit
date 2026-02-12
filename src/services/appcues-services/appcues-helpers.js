import { appcuesService } from '@/services/v2/appcues'

export const fetchTags = async () => {
  return appcuesService.fetchTags()
}

export const fetchLaunchpads = async () => {
  return appcuesService.fetchLaunchpads()
}

export const findTagIdByName = (tags, tagName) => {
  return appcuesService.findTagIdByName(tags, tagName)
}

export const filterLaunchpadsByTagId = (launchpads, tagId) => {
  return appcuesService.filterLaunchpadsByTagId(launchpads, tagId)
}
