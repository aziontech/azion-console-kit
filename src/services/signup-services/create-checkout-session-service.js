/**
 * Mock service for creating Stripe checkout sessions for plan purchases.
 * This is a placeholder implementation that returns mock data.
 * The real implementation will call the backend API to create a Stripe checkout session.
 *
 * @param {Object} params - The checkout parameters
 * @param {string} params.plan - The selected plan ('pro' | 'scale')
 * @returns {Promise<Object>} Mock checkout session data
 */
export const createCheckoutSessionService = async ({ plan }) => {
  // Placeholder implementation
  // Real implementation will call backend API like:
  // const response = await AxiosHttpClientAdapter.request({
  //   url: '/v4/payments/checkout/sessions',
  //   method: 'POST',
  //   body: { plan }
  // })
  // return parseHttpResponse(response)

  return {
    sessionId: `mock_session_${plan}_${Date.now()}`,
    plan,
    // Mock plan details for display purposes
    planDetails: {
      pro: {
        name: 'Pro Plan',
        price: 49.0,
        currency: 'USD'
      },
      scale: {
        name: 'Scale Plan',
        price: 199.0,
        currency: 'USD'
      }
    }[plan]
  }
}
