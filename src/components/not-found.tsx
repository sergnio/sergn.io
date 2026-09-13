import { Link } from '@tanstack/react-router'

export function NotFoundContent() {
  return (
    <div className="not-found page-shell">
      <p className="eyebrow">404</p>
      <h1>That page is not here.</h1>
      <p>Try one of the current collections instead.</p>
      <Link className="button-link" to="/">
        Back home
      </Link>
    </div>
  )
}
