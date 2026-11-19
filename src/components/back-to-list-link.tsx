import { Link, useRouter } from '@tanstack/react-router'
import type { MouseEvent, ReactNode } from 'react'
import type { CollectionName } from '#/lib/content-types'

declare module '@tanstack/history' {
  interface HistoryState {
    openedFromList?: CollectionName
  }
}

/** History state for a list's item links, so the item page knows Back returns there. */
export const openedFromList = (collection: CollectionName) => ({
  openedFromList: collection,
})

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 &&
  !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)

/**
 * A real link to a collection's list that, when the reader came from that list,
 * goes back instead so they land where they left off with no loop in history.
 */
export function BackToListLink({
  collection,
  children,
}: {
  collection: CollectionName
  children: ReactNode
}) {
  const router = useRouter()

  const goBackWhenListIsPrevious = (event: MouseEvent) => {
    const { location } = router.state
    if (location.state.openedFromList !== collection) return
    if (!router.history.canGoBack() || !isPlainClick(event)) return
    event.preventDefault()
    router.history.back()
  }

  return (
    <Link
      activeOptions={{ exact: true }}
      onClick={goBackWhenListIsPrevious}
      to={`/${collection}`}
    >
      {children}
    </Link>
  )
}
