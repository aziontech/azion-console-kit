/**
 * Chat service that makes a POST request and processes the response in stream.
 * @param {Object} params - Parameters for the request and processing.
 * @param {Object} params.parsedBody - Request body.
 * @param {string} params.server - Server URL.
 * @param {AbortSignal} params.signal - Signal to cancel the request.
 * @param {function(string): void} params.onMessage - Callback function to process stream messages.
 * @returns {Promise<void>}
 */
export async function chatService({ parsedBody, server, signal, onMessage }) {
  try {
    const response = await fetch(server, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsedBody),
      signal
    })

    if (!response.ok) throw new Error('Network response was not ok')

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    let reading = true
    while (reading) {
      const { done, value } = await reader.read()
      reading = !done

      if (done) break

      const chunk = decoder.decode(value)

      chunk
        .split('\n')
        .map((line) => line.replace(/^data: /, '').trim())
        .filter((line) => line && line !== '[DONE]')
        .forEach((line) => {
          try {
            const parsedLine = JSON.parse(line)
            const { choices } = parsedLine
            const content = choices[0]?.delta?.content
            if (content) onMessage(content, true)
          } catch (error) {
            console.error('Erro ao analisar JSON:', error, 'Linha:', line)
          }
        })
    }
  } catch (error) {
    onMessage('', false)
    if (error.name !== 'AbortError') {
      throw new Error('An error occurred while processing the chat stream')
    } else {
      throw error
    }
  } finally {
    onMessage('', false)
  }
}
