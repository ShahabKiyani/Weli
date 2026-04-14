import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFriendRequests } from '@/hooks/useFriendRequests'
import { APP_NAME, ROUTES } from '@/lib/constants'

const NAV_LINKS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.DISCOVER, label: 'Discover' },
  { to: ROUTES.FEED, label: 'Feed' },
]

export function NavBar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: friendRequests } = useFriendRequests(user?.id)
  const hasPendingRequests = (friendRequests?.length ?? 0) > 0

  async function handleSignOut() {
    setDropdownOpen(false)
    setMobileOpen(false)
    queryClient.clear()
    await signOut()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? 'User'
  // Prefer the stored profile avatar; fall back to the OAuth-provided one
  const avatarUrl =
    profile?.avatar_url ??
    (user?.user_metadata as Record<string, string> | undefined)?.avatar_url ??
    null

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-text hover:text-primary'}`

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="h-14 max-w-3xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to={ROUTES.DASHBOARD} className="font-bold text-xl text-secondary">
          {APP_NAME}
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Desktop">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop avatar + dropdown */}
        <div className="hidden md:flex items-center relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            aria-label="User menu"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            className="flex items-center gap-1.5 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
                  {displayName[0].toUpperCase()}
                </div>
              )}
              {hasPendingRequests && (
                <span
                  data-testid="friend-request-badge"
                  aria-label="Pending friend requests"
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-error border-2 border-card"
                />
              )}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted" aria-hidden="true" />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px] z-50"
            >
              <div className="px-4 py-2 text-sm font-semibold text-text border-b border-border">
                @{displayName}
              </div>
              <Link
                role="menuitem"
                to={ROUTES.PROFILE}
                onClick={() => setDropdownOpen(false)}
                className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface flex items-center gap-2 transition-colors"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                My Profile
              </Link>
              <button
                role="menuitem"
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-text hover:bg-surface flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-text hover:bg-surface transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="md:hidden border-t border-border bg-card"
        >
          <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={navLinkClass}
              >
                {({ isActive }) => (
                  <span className={`block py-2 ${isActive ? 'text-primary' : 'text-text'}`}>
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
            <Link
              to={ROUTES.PROFILE}
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm font-semibold text-text flex items-center gap-2"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              My Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="py-2 text-sm font-semibold text-error text-left flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
