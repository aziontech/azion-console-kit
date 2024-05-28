/* FILTER HELPERS */

export const infoAvailableFiltersCurrent = ({ filters }) => filters?.infoAvailable

export const currentFilters = ({ filters }) => filters?.selected

export const getDatasetAvailableFilters = ({ filters }) => filters?.datasetAvailable

export const getIsLoadingFilters = ({ filters }) => {
  return !filters?.datasetAvailable.length || !Object.keys(filters?.infoAvailable).length
}

/* GROUP HELPERS */

export const getGroupPages = ({ group }) => group?.all

export const pageCurrent = ({ group }) => group?.currentPage

export const groupPageCurrent = ({ group }) => group?.current

export const dashboardCurrent = ({ group }) => group?.currentDashboard

export const getCurrentInfo = ({ group }) => {
  return {
    Page: group?.currentPage.label,
    Dashboard: group?.currentDashboard.label,
    Group: group?.current.label
  }
}

export const getPages = ({ group }) => {
  return group?.current?.pagesDashboards?.map((item, idx) => ({
    idx: idx,
    id: item.id,
    label: item.label,
    path: item.path,
    dashboards: item.dashboards
  }))
}

export const dashboardBySelectedPage = ({ group }) => {
  if (!group?.current?.pagesDashboards) {
    return []
  }

  const page = group?.current.pagesDashboards.filter(
    (currentPage) => currentPage.id === group?.currentPage.id
  )

  return page?.[0]?.dashboards || []
}

export const currentIdPageAndDashboard = ({ group }) => {
  return {
    pageId: group?.currentPage.path,
    dashboardId: group?.currentDashboard.path
  }
}

/* REPORTS HELPERS */

export const getCurrentReportsData = ({ reports }) => reports?.current
