import { useSyncExternalStore } from 'react'

// Temporary A/B switches for testing on a phone, e.g. ?novt to turn on, ?novt=0 to turn off.
const variants = ['novt', 'syncimg', 'pushfirst'] as const
type Variant = (typeof variants)[number]

const storageKey = (variant: Variant) => `navvariant:${variant}`

export function rememberNavVariants() {
  const params = new URLSearchParams(location.search)
  for (const variant of variants) {
    const param = params.get(variant)
    if (param === '0') sessionStorage.removeItem(storageKey(variant))
    else if (param !== null) sessionStorage.setItem(storageKey(variant), '1')
  }
}

export function navVariantOn(variant: Variant) {
  return (
    typeof window !== 'undefined' &&
    sessionStorage.getItem(storageKey(variant)) === '1'
  )
}

export function activeNavVariants() {
  return variants.filter(navVariantOn)
}

const subscribeNever = () => () => undefined

export function useNavVariant(variant: Variant) {
  return useSyncExternalStore(
    subscribeNever,
    () => navVariantOn(variant),
    () => false,
  )
}

const pushFirstDelayMs = 250

// pushfirst: let the page draw normal frames after the history push before the crossfade starts.
export function delayViewTransitionsAfterPush() {
  if (!('startViewTransition' in document)) return
  const startViewTransition = document.startViewTransition.bind(document)
  document.startViewTransition = ((
    ...args: Parameters<Document['startViewTransition']>
  ) => {
    const updateCallbackDone = new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        startViewTransition(...args).updateCallbackDone.then(resolve, reject)
      }, pushFirstDelayMs)
    })
    return { updateCallbackDone } as ViewTransition
  }) as Document['startViewTransition']
}
