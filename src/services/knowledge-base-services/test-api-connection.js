// Simple test to check if we can reach the AI Studio API
export const testApiConnection = async () => {
  try {
    // Direct fetch to test
    const response = await fetch('/v4/workspace/ai/kbs', {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    const text = await response.text()

    return { status: response.status, body: text }
  } catch (error) {
    return { error: error.message }
  }
}
