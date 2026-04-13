/** Session flag set by PinGate after correct PIN; remove to show the PIN screen again. */
export const PIN_GATE_SESSION_KEY = 'medihealth_pin_unlocked'

function pinGateEnabledRaw() {
  return (
    import.meta.env.MEDI_PIN_GATE_ENABLED ??
    import.meta.env.VITE_PIN_GATE_ENABLED ??
    ''
  )
}

export function isPinGateEnabled() {
  return !['false', '0'].includes(String(pinGateEnabledRaw()).toLowerCase())
}

export function endPinGateSession() {
  try {
    sessionStorage.removeItem(PIN_GATE_SESSION_KEY)
  } catch {
    /* ignore */
  }
}
