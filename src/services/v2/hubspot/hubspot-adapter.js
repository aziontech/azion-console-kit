const VALID_FORM_ACTIONS = [
  'signup_email',
  'signup_sso_google',
  'signup_sso_github',
  'login_email',
  'login_sso_google',
  'login_sso_github'
]

export const HubspotAdapter = {
  getEventName(formAction) {
    if (formAction?.startsWith('signup_')) return 'sign_up'
    if (formAction?.startsWith('login_')) return 'sign_in'
    return formAction
  },

  isValidFormAction(action) {
    return VALID_FORM_ACTIONS.includes(action)
  },

  transformPayload(payload) {
    return {
      eventName: this.getEventName(payload.form_action),
      email: payload.email,
      utk: payload.utk,
      properties: {
        user_id__rtm_: payload.user_id__rtm_,
        form_action: payload.form_action,
        ...(payload.firstname && { firstname: payload.firstname }),
        ...(payload.lastname && { lastname: payload.lastname }),
        ...(payload.mobilephone && { mobilephone: payload.mobilephone }),
        ...(payload.company && { company: payload.company }),
        ...(payload.github_handle && { github_handle: payload.github_handle }),
        ...(payload.context || {})
      }
    }
  },

  validatePayload(payload) {
    const errors = []

    if (!payload.email) {
      errors.push('email is required')
    }

    if (!payload.form_action) {
      errors.push('form_action is required')
    } else if (!this.isValidFormAction(payload.form_action)) {
      errors.push(
        `Invalid form_action: ${payload.form_action}. Valid values: ${VALID_FORM_ACTIONS.join(', ')}`
      )
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
