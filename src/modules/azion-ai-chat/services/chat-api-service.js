import axios from 'axios'

export class ChatAPIService {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl
    this.apiKey = apiKey
    this.controller = null
  }

  async generateResponse(messages) {
    if (this.controller) {
      this.controller.abort()
    }

    this.controller = new AbortController()
    const signal = this.controller.signal

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 100,
          stream: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          },
          responseType: 'stream',
          signal
        }
      )

      const reader = response.data.getReader()
      const decoder = new TextDecoder('utf-8')
      let result = ''

      let reading = true
      while (reading) {
        const { done, value } = await reader.read()
        reading = !done

        if (!done) {
          const chunk = decoder.decode(value, { stream: true })
          chunk
            .split('\n')
            .map((line) => line.replace(/^data: /, '').trim())
            .filter((line) => line && line !== '[DONE]')
            .forEach((line) => {
              const parsedLine = JSON.parse(line)
              const content = parsedLine.choices?.[0]?.delta?.content
              if (content) {
                result += content
              }
            })
        }
      }

      return result
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message)
    }
  }

  cancelRequest() {
    if (this.controller) {
      this.controller.abort()
    }
  }
}
