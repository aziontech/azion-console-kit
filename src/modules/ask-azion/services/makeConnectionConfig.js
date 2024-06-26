export const makeConnectionConfig = () => {
  const OPEN_AI_ASSISTANT_ID = 'asst_ETZja2DRBDLPaIugNGwNk4jB'
  return {
    openAI: {
      key: import.meta.env.VITE_OPEN_AI_KEY,
      // validateKeyProperty: true,
      assistant: {
        assistant_id: OPEN_AI_ASSISTANT_ID
      }
    }
  }
}
