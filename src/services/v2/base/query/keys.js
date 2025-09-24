export function globalKey(key) {
  return ['GLOBAL', ...key].join(':')
}

export function sensitiveKey(key) {
  return ['SENSITIVE', ...key].join(':')
}
