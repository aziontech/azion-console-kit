import {
  fetchTags,
  fetchLaunchpads,
  findTagIdByName,
  filterLaunchpadsByTagId
} from './appcues-helpers'

const CHANGELOG_TAG_NAME = 'console-changelog'

const parseTextWithPipe = (text) => {
  if (!text || typeof text !== 'string') return { description: '', date: '' }

  const parts = text.split('|').map((part) => part.trim())
  return {
    description: parts[0] || '',
    date: parts[1] || ''
  }
}

const parseRelativeDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return ''

  const parts = dateStr.split('/')
  if (parts.length !== 3) return dateStr

  const [day, month, year] = parts
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const now = new Date()

  now.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  const diffTime = now - date
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return dateStr
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

const parseDateForSorting = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0)

  const parts = dateStr.split('/')
  if (parts.length !== 3) return new Date(dateStr)

  const [day, month, year] = parts
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

const extractChangelogItems = (launchpad) => {
  const actions = launchpad.steps?.[0]?.actions || {}
  const items = []

  const linkItemKeys = Object.keys(actions).filter((key) => key.startsWith('link-item-'))

  for (const key of linkItemKeys) {
    const actionList = actions[key]
    if (!Array.isArray(actionList)) continue

    for (const action of actionList) {
      const config = action.config || {}
      const interactionData = config.interactionData || {}

      if (interactionData.text && interactionData.text.includes('|')) {
        const parsed = parseTextWithPipe(interactionData.text)
        items.push({
          time: parsed.date,
          description: parsed.description
        })
      }
    }
  }

  return items
}

export const listChangelogService = async () => {
  try {
    const tags = await fetchTags()
    const changelogTagId = findTagIdByName(tags, CHANGELOG_TAG_NAME)

    if (!changelogTagId) {
      return []
    }

    const launchpads = await fetchLaunchpads()
    const changelogLaunchpads = filterLaunchpadsByTagId(launchpads, changelogTagId)

    if (changelogLaunchpads.length === 0) {
      return []
    }

    const allItems = changelogLaunchpads.flatMap(extractChangelogItems)

    const uniqueItems = Array.from(
      new Map(allItems.map((item) => [`${item.description}|${item.time}`, item])).values()
    )

    const sortedItems = uniqueItems.sort((itemA, itemB) => {
      const dateA = parseDateForSorting(itemA.time)
      const dateB = parseDateForSorting(itemB.time)
      return dateB - dateA
    })

    return sortedItems.map((item) => ({
      ...item,
      time: parseRelativeDate(item.time)
    }))
  } catch {
    return []
  }
}
