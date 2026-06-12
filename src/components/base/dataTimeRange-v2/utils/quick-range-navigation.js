const normalizeUnit = (unit) => {
  if (!unit) return null
  const normalizedUnitCandidate = String(unit).toLowerCase().trim()
  if (normalizedUnitCandidate === 'minute' || normalizedUnitCandidate === 'minutes')
    return 'minutes'
  if (normalizedUnitCandidate === 'hour' || normalizedUnitCandidate === 'hours') return 'hours'
  if (normalizedUnitCandidate === 'day' || normalizedUnitCandidate === 'days') return 'days'
  if (normalizedUnitCandidate === 'month' || normalizedUnitCandidate === 'months') return 'months'
  return null
}

const parseRelativeFromLabel = (label) => {
  if (!label || typeof label !== 'string') return null

  const match = label.trim().match(/^(last|next)\s+(\d+)\s+([a-zA-Z]+)$/i)
  if (!match) return null

  const value = Number(match[2])
  if (!Number.isFinite(value) || value <= 0) return null

  const unit = normalizeUnit(match[3])
  if (!unit) return null

  return {
    direction: match[1].toLowerCase(),
    value,
    unit
  }
}

const addDuration = (date, value, unit, sign) => {
  const base = new Date(date)
  const delta = sign * value

  if (unit === 'months') {
    const next = new Date(base)
    next.setMonth(next.getMonth() + delta)
    return next
  }

  if (unit === 'days') {
    const next = new Date(base)
    next.setDate(next.getDate() + delta)
    return next
  }

  const msPerUnit = unit === 'hours' ? 60 * 60 * 1000 : 60 * 1000
  return new Date(base.getTime() + delta * msPerUnit)
}

export const getQuickRangeStep = (model) => {
  const rel = model?.quick
  const unit = normalizeUnit(rel?.unit)

  if (unit && Number.isFinite(rel?.value) && rel.value > 0) {
    return { value: rel.value, unit, direction: rel?.direction }
  }

  return parseRelativeFromLabel(model?.label)
}

export const shiftQuickRange = (model, direction) => {
  const step = getQuickRangeStep(model)
  if (!step) return null

  const startDate = model?.startDate ? new Date(model.startDate) : null
  const endDate = model?.endDate ? new Date(model.endDate) : null

  if (!startDate || !endDate) return null

  const sign = direction === 'next' ? 1 : -1

  return {
    startDate: addDuration(startDate, step.value, step.unit, sign),
    endDate: addDuration(endDate, step.value, step.unit, sign)
  }
}
