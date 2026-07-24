export const makeCopilotWidgetUrl = () => {
  return (
    import.meta.env.VITE_COPILOT_WIDGET_URL ||
    'http://localhost:3000/widget/azion-chat-widget.iife.js'
  )
}
