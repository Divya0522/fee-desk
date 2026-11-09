import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  RotateCcw,
  CreditCard,
  PhoneCall,
  Bell,
  UploadCloud,
  Menu,
  X,
  LogOut,
  Building2,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../i18n/useLang'
import * as staffApi from '../../services/staffApi'

export default function AccountsLayout() {
  const { user, logout, showToast } = useAuth()
  const { lang, setLang } = useLang()
  const isHindi = lang === 'hi'
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [openPaymentsCount, setOpenPaymentsCount] = useState(0)
  const [openRiskCount, setOpenRiskCount] = useState(0)

  // Fetch open badge counts for Payments Queue and Call Tasks
  useEffect(() => {
    let isMounted = true

    const fetchCounts = async () => {
      try {
        const [paymentsRes, riskRes] = await Promise.allSettled([
          staffApi.getUnmatchedPayments({ status: 'open' }),
          staffApi.getRiskFlags({ status: 'open' }),
        ])

        if (isMounted) {
          if (paymentsRes.status === 'fulfilled' && paymentsRes.value) {
            const list = Array.isArray(paymentsRes.value)
              ? paymentsRes.value
              : paymentsRes.value.data || []
            setOpenPaymentsCount(list.length)
          }
          if (riskRes.status === 'fulfilled' && riskRes.value) {
            const list = Array.isArray(riskRes.value)
              ? riskRes.value
              : riskRes.value.data || []
            setOpenRiskCount(list.length)
          }
        }
      } catch {
        // Silently preserve 0 count if endpoint is loading
      }
    }

    fetchCounts()
    // Refresh badges every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/signin?role=staff', { replace: true })
    } catch {
      navigate('/signin', { replace: true })
    }
  }

  const staffName = user?.name || (isHindi ? 'अकाउंट्स एग्जीक्यूटिव' : 'Accounts Executive')
  const staffRole = user?.role === 'admin' ? 'Admin' : user?.role === 'centre_admin' ? 'Centre Admin' : 'Accounts'
  const staffCentre = user?.centre || (isHindi ? 'सभी केंद्र' : 'All centres')

  const navItems = [
    {
      to: '/accounts',
      end: true,
      label: isHindi ? 'डैशबोर्ड' : 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/accounts/students',
      label: isHindi ? 'विद्यार्थी' : 'Students',
      icon: Users,
    },
    {
      to: '/accounts/refunds',
      label: isHindi ? 'रिफंड' : 'Refunds',
      icon: RotateCcw,
    },
    {
      to: '/accounts/payments',
      label: isHindi ? 'पेमेंट्स क्यू' : 'Payments queue',
      icon: CreditCard,
      badge: openPaymentsCount > 0 ? openPaymentsCount : null,
      badgeColor: 'bg-[#D98A1E] text-white',
    },
    {
      to: '/accounts/risk',
      label: isHindi ? 'कॉल टास्क' : 'Call tasks',
      icon: PhoneCall,
      badge: openRiskCount > 0 ? openRiskCount : null,
      badgeColor: 'bg-[#B3261E] text-white',
    },
    {
      to: '/accounts/reminders',
      label: isHindi ? 'रिमाइंडर' : 'Reminders',
      icon: Bell,
    },
    {
      to: '/accounts/uploads',
      label: isHindi ? 'अपलोड्स' : 'Uploads',
      icon: UploadCloud,
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#14211F] font-sans flex flex-col lg:flex-row">
      {/* ──────────────────────────────────────────────────────────
          MOBILE TOPBAR
         ────────────────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#E7E3DA] px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 -ml-2 text-[#4A5654] hover:text-[#14211F] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <Link to="/accounts" className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" width="26" height="26" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#0E4D44" />
              <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
              <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
              <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
              <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
            </svg>
            <span className="font-serif font-bold text-lg text-[#14211F] tracking-tight">FeeDesk</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E6F0EE] text-[#0E4D44]">
              {staffRole}
            </span>
          </Link>
        </div>

        {/* Language switch */}
        <div className="inline-flex items-center border border-[#E7E3DA] rounded-md overflow-hidden bg-white text-xs font-medium">
          <button
            type="button"
            className={`px-2.5 py-1 transition-colors ${lang === 'en' ? 'bg-[#0E4D44] text-[#FAF8F4] font-semibold' : 'text-[#4A5654] hover:text-[#14211F]'}`}
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 transition-colors ${lang === 'hi' ? 'bg-[#0E4D44] text-[#FAF8F4] font-semibold' : 'text-[#4A5654] hover:text-[#14211F]'}`}
            onClick={() => setLang('hi')}
            aria-pressed={lang === 'hi'}
          >
            हिं
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          MOBILE SLIDE-OUT DRAWER
         ────────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#14211F]/30 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white border-r border-[#E7E3DA] p-5 flex flex-col justify-between shadow-xl animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
                <div className="flex items-center gap-2.5">
                  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true">
                    <rect width="32" height="32" rx="8" fill="#0E4D44" />
                    <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
                    <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
                    <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
                    <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
                  </svg>
                  <div>
                    <div className="font-serif font-bold text-lg text-[#14211F] leading-none">FeeDesk</div>
                    <div className="text-[11px] text-[#7A8582] mt-0.5">{staffRole} Suite</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-[#7A8582] hover:text-[#14211F] hover:bg-[#FAF8F4]"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Centre Scope */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-xs text-[#4A5654]">
                <Building2 size={14} className="text-[#0E4D44] shrink-0" />
                <span className="font-medium text-[#7A8582]">{isHindi ? 'कार्यक्षेत्र:' : 'Scope:'}</span>
                <span className="font-semibold text-[#14211F] truncate">{staffCentre}</span>
              </div>

              {/* Mobile Nav Links */}
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
                        `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#E6F0EE] text-[#0E4D44] font-semibold'
                            : 'text-[#4A5654] hover:bg-[#FAF8F4] hover:text-[#14211F]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} strokeWidth={1.5} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-[#0E4D44] text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-[#E7E3DA] space-y-3">
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-full bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center font-bold text-xs uppercase">
                  {staffName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#14211F] truncate">{staffName}</div>
                  <div className="text-xs text-[#7A8582] truncate">{user?.email || staffCentre}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-[#E7E3DA] bg-white hover:bg-[#FDECEA] hover:border-[#B3261E] hover:text-[#B3261E] text-xs font-semibold text-[#4A5654] transition-colors"
              >
                <LogOut size={14} />
                <span>{isHindi ? 'लॉगआउट करें' : 'Sign out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          DESKTOP SIDEBAR (240px)
         ────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-white border-r border-[#E7E3DA] flex-col justify-between min-h-screen sticky top-0 h-screen py-6 px-4">
        <div className="space-y-6">
          {/* Brand Lockup */}
          <Link to="/accounts" className="flex items-center gap-2.5 px-2 group">
            <svg viewBox="0 0 32 32" width="30" height="30" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#0E4D44" />
              <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
              <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
              <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
              <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
            </svg>
            <div>
              <div className="font-serif font-bold text-lg text-[#14211F] leading-tight">FeeDesk</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E6F0EE] text-[#0E4D44]">
                  {staffRole}
                </span>
                <span className="text-[11px] text-[#7A8582]">Portal</span>
              </div>
            </div>
          </Link>

          {/* Centre Scope Pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-xs text-[#4A5654]">
            <Building2 size={14} className="text-[#0E4D44] shrink-0" />
            <span className="text-[#7A8582]">{isHindi ? 'दायरा:' : 'Scope:'}</span>
            <span className="font-semibold text-[#14211F] truncate" title={staffCentre}>
              {staffCentre}
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1" aria-label="Staff navigation">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#E6F0EE] text-[#0E4D44] font-semibold shadow-xs'
                        : 'text-[#4A5654] hover:bg-[#FAF8F4] hover:text-[#14211F]'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={17} strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-[#0E4D44] text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* User Card, Language Toggle & Sign out */}
        <div className="space-y-4 pt-4 border-t border-[#E7E3DA]">
          {/* Language Switcher */}
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-[#7A8582] font-medium">{isHindi ? 'भाषा:' : 'Language:'}</span>
            <div className="inline-flex items-center border border-[#E7E3DA] rounded-md overflow-hidden bg-[#FAF8F4]">
              <button
                type="button"
                className={`px-2 py-0.5 font-medium transition-colors ${lang === 'en' ? 'bg-[#0E4D44] text-white font-semibold' : 'text-[#4A5654] hover:text-[#14211F]'}`}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                className={`px-2 py-0.5 font-medium transition-colors ${lang === 'hi' ? 'bg-[#0E4D44] text-white font-semibold' : 'text-[#4A5654] hover:text-[#14211F]'}`}
                onClick={() => setLang('hi')}
                aria-pressed={lang === 'hi'}
              >
                हिं
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {staffName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#14211F] truncate" title={staffName}>
                {staffName}
              </div>
              <div className="text-[11px] text-[#7A8582] truncate">
                {user?.email || staffRole}
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-[#E7E3DA] bg-white hover:bg-[#FDECEA] hover:border-[#B3261E] hover:text-[#B3261E] text-xs font-medium text-[#4A5654] transition-colors"
          >
            <LogOut size={13} />
            <span>{isHindi ? 'लॉगआउट' : 'Sign out'}</span>
          </button>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────
          MAIN CONTENT AREA (Max-width 1280px)
         ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
