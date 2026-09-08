import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useId, useState } from 'react'

const navigation = [
  { to: '/coffee', label: 'Coffee' },
  { to: '/wings', label: 'Wings' },
  { to: '/na-beers', label: 'N/A Beers' },
  { to: '/reubens', label: 'Reubens' },
  { to: '/blog', label: 'Blog' },
] as const

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark" to="/" aria-label="sergn.io home">
          sergn<span>.io</span>
        </Link>
        <button
          aria-controls={menuId}
          aria-expanded={open}
          className="menu-button"
          onClick={() => setOpen((isOpen) => !isOpen)}
          type="button"
        >
          <span aria-hidden="true">{open ? '×' : '☰'}</span>
          <span>{open ? 'Close menu' : 'Menu'}</span>
        </button>
        <nav
          aria-label="Primary navigation"
          className="primary-nav"
          data-open={open}
          id={menuId}
        >
          <ul>
            {navigation.map((item) => (
              <li key={item.to}>
                <Link activeProps={{ 'aria-current': 'page' }} to={item.to}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
