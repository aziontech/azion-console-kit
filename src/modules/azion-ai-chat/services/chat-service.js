export async function chatService({ parsedBody, server, signal }) {
  return fetch(server, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parsedBody),
    signal
  })
}
