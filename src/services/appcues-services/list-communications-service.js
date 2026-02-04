import {
  fetchTags,
  fetchLaunchpads,
  findTagIdByName,
  filterLaunchpadsByTagId
} from './appcues-helpers'

const COMMUNICATIONS_TAG_NAME = 'console-communications'

const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  return /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(url)
}

const parseTextWithPipe = (text) => {
  if (!text || typeof text !== 'string') return { message: '', tag: '' }

  const parts = text.split('|').map((part) => part.trim())
  return {
    message: parts[0] || '',
    tag: parts[1] || ''
  }
}

const extractCommunicationData = (launchpad) => {
  const actions = launchpad.steps?.[0]?.actions || {}

  let image = null
  let ctaHref = null
  let message = ''
  let tag = ''

  const linkItemKeys = Object.keys(actions).filter((key) => key.startsWith('link-item-'))

  for (const key of linkItemKeys) {
    const actionList = actions[key]
    if (!Array.isArray(actionList)) continue

    for (const action of actionList) {
      const config = action.config || {}
      const url = config.url

      if (url && isImageUrl(url) && !image) {
        image = url
      }

      if (url && !isImageUrl(url) && !ctaHref) {
        ctaHref = url
      }

      const interactionData = config.interactionData || {}
      
      if (interactionData.text) {
        const text = interactionData.text
        if (text.includes('|')) {
          const parsed = parseTextWithPipe(text)
          message = parsed.message
          tag = parsed.tag
        }
      }

      if (interactionData.url && !isImageUrl(interactionData.url) && !ctaHref) {
        ctaHref = interactionData.url
      }
    }
  }

  return {
    id: launchpad.id,
    name: message,
    tag: tag || null,
    ctaText: 'SEE BLOGPOST HERE',
    ctaHref,
    image
  }
}

export const listCommunicationsService = async () => {
  try {
    const tags = await fetchTags()
    const communicationsTagId = findTagIdByName(tags, COMMUNICATIONS_TAG_NAME)

    if (!communicationsTagId) {
      return []
    }

    const launchpads = await fetchLaunchpads()
    const communicationsLaunchpads = filterLaunchpadsByTagId(launchpads, communicationsTagId)

    if (communicationsLaunchpads.length === 0) {
      return []
    }

    return communicationsLaunchpads.map(extractCommunicationData)
  } catch {
    return []
  }
}
