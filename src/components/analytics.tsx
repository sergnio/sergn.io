import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'

declare global {
  interface Window {
    goatcounter?: { count: (vars: { path: string }) => void }
  }
}

/**
 * GoatCounter counts the first pageview itself when count.js loads, but the
 * site navigates client-side after that, so every route change past the
 * landing page would otherwise go unrecorded. This reports those, and skips
 * the first render so the landing page is not counted twice.
 */
export function Analytics() {
  const location = useRouterState({ select: (state) => state.location })
  const countedInitial = useRef(false)

  useEffect(() => {
    if (!countedInitial.current) {
      countedInitial.current = true
      return
    }
    window.goatcounter?.count({
      path: location.pathname + location.searchStr,
    })
  }, [location.pathname, location.searchStr])

  return null
}
