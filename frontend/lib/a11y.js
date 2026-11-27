export const A11Y_KEY = 'qnetra_a11y_boost'
export const A11Y_EVENT = 'qnetra-a11y-change'

export function readA11y() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(A11Y_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeA11y(on) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(A11Y_KEY, on ? 'true' : 'false')
  } catch {}
  window.dispatchEvent(new CustomEvent(A11Y_EVENT, { detail: { on } }))
}

export function toggleA11y(current) {
  const next = !current
  writeA11y(next)
  return next
}
