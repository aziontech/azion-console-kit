// Simple test to check if we can reach the AI Studio API
export const testApiConnection = async () => {
  console.log('🧪 TESTING API CONNECTION...')
  
  try {
    // Direct fetch to test
    const response = await fetch('/v4/workspace/ai/kb', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    console.log('🌐 Fetch Response Status:', response.status)
    console.log('🌐 Fetch Response Headers:', response.headers)
    
    const text = await response.text()
    console.log('🌐 Fetch Response Body:', text)
    
    return { status: response.status, body: text }
  } catch (error) {
    console.log('❌ Fetch Error:', error)
    return { error: error.message }
  }
}