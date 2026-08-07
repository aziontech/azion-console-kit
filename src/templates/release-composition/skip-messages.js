export const SKIP_MESSAGES = {
  degraded: "Couldn't read the active release.",
  mismatch: 'The resource is not part of this Deployment Settings.',
  unresolved_version: 'No Ready version resolved for the resource.'
}

export const skipMessageFor = (reason) => SKIP_MESSAGES[reason] ?? 'Deployment skipped.'
