export const DATABASE_STATUSES = {
  CREATING: 'creating',
  CREATED: 'created',
  READY: 'ready',
  DELETING: 'deleting',
  DELETED: 'deleted',
  FAILED: 'failed',
  ERROR: 'error'
}

export const STATUS_SEVERITY = {
  [DATABASE_STATUSES.CREATING]: 'warning',
  [DATABASE_STATUSES.CREATED]: 'success',
  [DATABASE_STATUSES.READY]: 'success',
  [DATABASE_STATUSES.DELETING]: 'danger',
  [DATABASE_STATUSES.DELETED]: 'success',
  [DATABASE_STATUSES.FAILED]: 'danger',
  [DATABASE_STATUSES.ERROR]: 'danger'
}

export const STATUS_ICONS = {
  [DATABASE_STATUSES.CREATING]: 'pi pi-spin pi-spinner',
  [DATABASE_STATUSES.CREATED]: 'pi pi-check',
  [DATABASE_STATUSES.READY]: 'pi pi-check',
  [DATABASE_STATUSES.DELETING]: 'pi pi-spin pi-spinner',
  [DATABASE_STATUSES.DELETED]: 'pi pi-check',
  [DATABASE_STATUSES.FAILED]: 'pi pi-exclamation-triangle',
  [DATABASE_STATUSES.ERROR]: 'pi pi-exclamation-triangle'
}

export const STATUS_LABELS = {
  [DATABASE_STATUSES.CREATING]: 'Creating',
  [DATABASE_STATUSES.CREATED]: 'Ready',
  [DATABASE_STATUSES.READY]: 'Ready',
  [DATABASE_STATUSES.DELETING]: 'Deleting',
  [DATABASE_STATUSES.DELETED]: 'Deleted',
  [DATABASE_STATUSES.FAILED]: 'Failed',
  [DATABASE_STATUSES.ERROR]: 'Error'
}

export const isPendingStatus = (status) => {
  return [DATABASE_STATUSES.CREATING, DATABASE_STATUSES.DELETING].includes(status)
}

export const isCompletedStatus = (status) => {
  return [DATABASE_STATUSES.CREATED, DATABASE_STATUSES.READY, DATABASE_STATUSES.DELETED].includes(status)
}

export const isFailedStatus = (status) => {
  return [DATABASE_STATUSES.FAILED, DATABASE_STATUSES.ERROR].includes(status)
}

export const isAvailableForQueries = (status) => {
  return [DATABASE_STATUSES.CREATED, DATABASE_STATUSES.READY].includes(status)
}

export const getStatusConfig = (status) => {
  return {
    severity: STATUS_SEVERITY[status] || 'secondary',
    icon: STATUS_ICONS[status] || 'pi pi-info-circle',
    label: STATUS_LABELS[status] || status || 'Unknown'
  }
}

export const getStatusContent = (database) => {
  return database.status?.content || database.status
}

export const getDatabaseName = (database) => {
  return database.name?.text || database.name
} 