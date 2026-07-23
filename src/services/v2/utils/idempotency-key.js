export const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const randomSegment = () => Math.random().toString(36).slice(2, 10)
  return `${Date.now().toString(36)}-${randomSegment()}-${randomSegment()}`
}
