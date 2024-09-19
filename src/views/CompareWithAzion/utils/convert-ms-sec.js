export function convertMsToSeconds(ms) {
  let seconds = (ms / 1000).toFixed(3); // Convert ms to seconds and format to 3 decimal places
  return seconds.startsWith('0') ? seconds.slice(1) : seconds;
}