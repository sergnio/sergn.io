import { useDocumentOperation } from 'sanity'
import type { DocumentActionComponent } from 'sanity'
import { withPreviousSlug } from './schemaTypes/shared'

type SluggedDocument = {
  slug?: { current?: string }
  previousSlugs?: string[]
}

/** Wraps Publish so a changed slug leaves its old URL behind as a redirect. */
export function rememberPreviousSlug(
  publish: DocumentActionComponent,
): DocumentActionComponent {
  const RememberPreviousSlugAction: DocumentActionComponent = (props) => {
    const action = publish(props)
    const { patch } = useDocumentOperation(props.id, props.type)
    if (!action) return action

    return {
      ...action,
      onHandle: () => {
        const draft = props.draft as SluggedDocument | null
        const published = props.published as SluggedDocument | null
        const previousSlugs = draft?.previousSlugs ?? []
        const nextPreviousSlugs = withPreviousSlug(
          previousSlugs,
          published?.slug?.current,
          draft?.slug?.current,
        )
        if (nextPreviousSlugs.join('\n') !== previousSlugs.join('\n')) {
          patch.execute([{ set: { previousSlugs: nextPreviousSlugs } }])
        }
        action.onHandle?.()
      },
    }
  }
  RememberPreviousSlugAction.action = publish.action
  RememberPreviousSlugAction.displayName = 'RememberPreviousSlugAction'
  return RememberPreviousSlugAction
}
