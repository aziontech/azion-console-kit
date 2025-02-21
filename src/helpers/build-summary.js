
export const buildSummary = (httpResponse) => {
  return Object.entries(httpResponse)
  .filter(([key]) => key !== 'ts')
  .sort(([currentKey], [nextKey]) => currentKey.localeCompare(nextKey)) 
  .map(([key, value]) => ({ key, value }));
}
