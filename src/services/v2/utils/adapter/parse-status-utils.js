export const parseStatusData = (status) => {
  const parsedStatus = status
    ? {
      content: 'Active',
      severity: 'success'
    }
    : {
      content: 'Inactive',
      severity: 'danger'
    }

  return parsedStatus
}

export const parseDefaultData = (status) => {
  const parsedStatus = status
    ? {
      content: 'Yes',
      severity: 'success'
    }
    : {
      content: 'No',
      severity: 'danger'
    }

  return parsedStatus
}
