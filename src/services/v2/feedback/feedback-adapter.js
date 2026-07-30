export const FeedbackAdapter = {
  transformPayload(payload) {
    return {
      type: payload.type,
      account_id: payload.accountId,
      client_id: payload.clientId,
      name: payload.name,
      email: payload.email,
      description: payload.description
    }
  }
}
