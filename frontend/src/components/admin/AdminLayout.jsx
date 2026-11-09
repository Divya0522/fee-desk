import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users2,
  ScrollText,
  Activity,
  SlidersHorizontal,
  Menu,
  X,
  LogOut,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../i18n/useLang'
import ChangePasswordModal from '../auth/ChangePasswordModal'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { lang, setLang } = useLang()
  const isHindi = lang === 'hi'
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(Boolean(user?.mustChangePassword))

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/signin?role=staff', { replace: true })
    } catch {
      navigate('/signin', { replace: true })
    }
  }

  const adminName = user?.name || (isHindi ? 'सिस्टम एडमिन' : 'System Administrator')
  const adminEmail = user?.email || 'admin@feedesk.in'

  const navItems = [
    {
      to: '/admin',
      end: true,
      label: isHindi ? 'अवलोकन' : 'Overview',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/staff',
      label: isHindi ? 'स्टाफ़ प्रबंधन' : 'Staff',
      icon: Users2,
    },
    {
      to: '/admin/audit',
      label: isHindi ? 'ऑडिट लॉग' : 'Audit Log',
      icon: ScrollText,
    },
    {
      to: '/admin/jobs',
      label: isHindi ? 'स्वचालन जॉब्स' : 'Jobs',
      icon: Activity,
    },
    {
      to: '/admin/settings',
      label: isHindi ? 'सिस्टम सेटिंग्स' : 'Settings',
      icon: SlidersHorizontal,
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#14211F] flex flex-col md:flex-row antialiased">
      {/* ──────────────────────────────────────────────────────────
          DESKTOP SIDEBAR (240px FIXED)
         ────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[#E7E3DA] bg-[#FAF8F4] min-h-screen p-4 sticky top-0 h-screen z-30">
        {/* Monogram Brand Header */}
        <div className="flex items-center gap-2.5 pb-6 border-b border-[#E7E3DA]">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#0E4D44] rounded-lg p-0.5"
            aria-label="FeeDesk Admin Home"
          >
            <svg
              className="brand-monogram shrink-0 transition-transform group-hover:scale-105"
              viewBox="0 0 32 32"
              width="30"
              height="30"
              fill="none"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="7" fill="#0E4D44" />
              <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
              <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
              <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
              <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="font-serif font-bold text-lg text-[#14211F] tracking-tight">
                FeeDesk
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#0E4D44]">
                {isHindi ? 'एडमिन सूट' : 'Admin Suite'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 space-y-1" aria-label="Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-white text-[#0E4D44] shadow-xs border border-[#E7E3DA]'
                      : 'text-[#4A5654] hover:bg-[#FAF8F4] hover:text-[#14211F]'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className="shrink-0 text-[#0E4D44]" />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer with Language Switcher & Admin Profile */}
        <div className="pt-4 border-t border-[#E7E3DA] space-y-3">
          {/* Language Toggle */}
          <div className="flex items-center justify-between px-2 py-1 bg-white rounded-xl border border-[#E7E3DA] text-xs">
            <span className="text-[11px] font-medium text-[#7A8582]">
              {isHindi ? 'भाषा:' : 'Language:'}
            </span>
            <div className="flex items-center gap-1 font-semibold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  !isHindi
                    ? 'bg-[#0E4D44] text-white'
                    : 'text-[#4A5654] hover:text-[#14211F]'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  isHindi
                    ? 'bg-[#0E4D44] text-white'
                    : 'text-[#4A5654] hover:text-[#14211F]'
                }`}
              >
                हिं
              </button>
            </div>
          </div>

          {/* Admin Identity Card */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E7E3DA] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#E6F0EE] text-[#0E4D44] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                  {adminName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#14211F] truncate">
                    {adminName}
                  </div>
                  <div className="text-[10px] text-[#7A8582] truncate">
                    {adminEmail}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#E7E3DA]/60">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0E4D44] bg-[#E6F0EE] px-1.5 py-0.5 rounded-md">
                <ShieldCheck size={11} />
                <span>Admin</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A8582] hover:text-[#B3261E] transition-colors"
                title="Sign out"
              >
                <LogOut size={12} />
                <span>{isHindi ? 'लॉगआउट' : 'Sign out'}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────
          MOBILE TOPBAR
         ────────────────────────────────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FAF8F4] border-b border-[#E7E3DA] sticky top-0 z-40">
        <Link to="/admin" className="flex items-center gap-2">
          <svg
            className="brand-monogram shrink-0"
            viewBox="0 0 32 32"
            width="26"
            height="26"
            fill="none"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="7" fill="#0E4D44" />
            <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
            <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
            <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
            <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
          </svg>
          <span className="font-serif font-bold text-base text-[#14211F]">
            FeeDesk Admin
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(isHindi ? 'en' : 'hi')}
            className="px-2 py-1 rounded-lg border border-[#E7E3DA] bg-white text-[11px] font-semibold text-[#0E4D44]"
          >
            {isHindi ? 'EN' : 'हिं'}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl border border-[#E7E3DA] bg-white text-[#14211F]"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-[#14211F]/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="bg-[#FAF8F4] rounded-t-3xl border-t border-[#E7E3DA] p-5 space-y-3 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
              <div className="text-xs font-bold text-[#14211F]">
                {adminName} ({adminEmail})
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-[#7A8582]"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-white text-[#0E4D44] shadow-xs border border-[#E7E3DA]'
                          : 'text-[#4A5654] hover:bg-white'
                      }`
                    }
                  >
                    <Icon size={16} className="text-[#0E4D44]" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            <div className="pt-3 border-t border-[#E7E3DA]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-[#E7E3DA] text-xs font-semibold text-[#B3261E]"
              >
                <LogOut size={14} />
                <span>{isHindi ? 'लॉगआउट' : 'Sign out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MAIN CONTENT AREA
         ────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Force Change Password Modal if user.mustChangePassword */}
      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onSuccess={() => setShowPasswordModal(false)}
          forced={true}
        />
      )}
    </div>
  )
}
