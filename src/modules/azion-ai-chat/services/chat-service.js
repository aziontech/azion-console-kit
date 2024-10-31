/**
 * Serviço de chat que faz uma requisição POST e processa a resposta em stream.
 * @param {Object} params - Parâmetros para a requisição e processamento.
 * @param {Object} params.parsedBody - Corpo da requisição.
 * @param {string} params.server - URL do servidor.
 * @param {AbortSignal} params.signal - Sinal para cancelar a requisição.
 * @param {function(string): void} params.onMessage - Função de callback para processar mensagens do stream.
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
        .map(JSON.parse)
        .forEach(({ choices }) => {
          const content = choices[0]?.delta?.content
          if (content) onMessage(content)
        })
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      throw new Error('An error occurred while processing the chat stream')
    } else {
      throw error
    }
  }
}
