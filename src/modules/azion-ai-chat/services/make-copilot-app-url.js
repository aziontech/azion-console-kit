export const makeCopilotAppUrl = () => {
  return import.meta.env.VITE_COPILOT_APP_URL || '/copilot-api/api/chat'
}
