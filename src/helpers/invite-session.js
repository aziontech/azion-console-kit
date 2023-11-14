/* eslint-disable class-methods-use-this */
class InviteSession {
  static show() {
    try {
      const { isInviteBlockVisable } = JSON.parse(sessionStorage.getItem('displayInviteYourTeam'))
      return isInviteBlockVisable
    } catch (error) {
      return true
    }
  }

  static haveSession() {
    return !!JSON.parse(sessionStorage.getItem('displayInviteYourTeam'))
  }

  static sessionIsExpired() {
    let showInviteYourTeam = true

    if (!this.haveSession()) {
      return showInviteYourTeam
    }
    const { time, isInviteBlockVisable } = JSON.parse(
      sessionStorage.getItem('displayInviteYourTeam')
    )
    const sessionStartDate = new Date(time)
    const currentDate = new Date()

    const transformMillisencondsToHour = 36e5
    const oneDayInHours = 24

    const sessionExpired =
      Math.abs(sessionStartDate - currentDate) / transformMillisencondsToHour >= oneDayInHours

    showInviteYourTeam = !isInviteBlockVisable && sessionExpired
    return showInviteYourTeam
  }

  static turnInviteBlockVisable() {
    InviteSession.setItemInSession({ time: new Date(), isInviteBlockVisable: true })
  }

  static closeInviteBlock() {
    InviteSession.setItemInSession({ time: new Date(), isInviteBlockVisable: false })
  }

  static setItemInSession(data) {
    sessionStorage.setItem('displayInviteYourTeam', JSON.stringify(data))
  }
}

export default InviteSession
