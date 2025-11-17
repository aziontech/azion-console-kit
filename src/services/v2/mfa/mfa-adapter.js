const CONFIRMED_AS_TAG = {
  true: {
    content: 'Confirmed',
    severity: 'success'
  },
  false: {
    content: 'Not Confirmed',
    severity: 'danger'
  }
}

export const MFAAdapter = {
  transformListMfa(data) {
    return (
      data?.map((user) => {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          confirmed: CONFIRMED_AS_TAG[user.confirmed]
        }
      }) || []
    )
  }
}
