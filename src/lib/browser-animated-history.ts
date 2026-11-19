// A back/forward swipe already slides the page in Safari and Chrome on Android.
// The site's own view transition on top of that slide is the flash, so skip it.
let lastPopWasAnimated = false
let gestureSinceLastNavigation = false
let pendingSignal = 'push'
/** Temporary, read by the ?navdebug log. */
export const lastAnimatedDecision = { signal: 'none' }

function noteGesture() {
  gestureSinceLastNavigation = true
}

// Older Safari never reports hasUAVisualTransition, so fall back to a touch or
// horizontal trackpad swipe since the last navigation, as Jerry Cheung's demo does.
function popWasAnimated(event: PopStateEvent) {
  if ('hasUAVisualTransition' in event) return event.hasUAVisualTransition
  return gestureSinceLastNavigation
}

// Listening at import, before the router exists, puts this ahead of the
// router's own popstate listener.
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    lastPopWasAnimated = popWasAnimated(event)
    pendingSignal = `${'hasUAVisualTransition' in event ? 'ua' : 'touch'}:${lastPopWasAnimated ? 'Y' : 'n'}`
  })
  window.addEventListener('touchend', noteGesture, { passive: true })
  window.addEventListener('touchcancel', noteGesture, { passive: true })
  window.addEventListener(
    'wheel',
    (event) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) noteGesture()
    },
    { passive: true },
  )
}

/** Answers for the navigation about to render, then forgets. */
export function browserAnimatedThisNavigation() {
  const animated = lastPopWasAnimated
  lastAnimatedDecision.signal = pendingSignal
  pendingSignal = 'push'
  lastPopWasAnimated = false
  gestureSinceLastNavigation = false
  return animated
}
