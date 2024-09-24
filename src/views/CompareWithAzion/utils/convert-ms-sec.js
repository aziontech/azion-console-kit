export function convertMsToSeconds(ms) {
  let seconds = (ms / 1000).toFixed(3)
  return seconds.startsWith('0') ? seconds.slice(1) : seconds
}