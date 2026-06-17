let _lastTs = 0
let _seq = 0

export const generateCurrentTimestamp = () => {
  const now = Date.now()
  if (now === _lastTs) {
    _seq += 1
  } else {
    _lastTs = now
    _seq = 0
  }
  return `${now}_${_seq}`
}
