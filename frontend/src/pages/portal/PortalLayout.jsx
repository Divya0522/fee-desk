import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { 
  CreditCard, 
  FileText, 
  GraduationCap, 
  LogOut, 
  ShieldCheck, 
  Phone, 
  Globe, 
  ChevronDown,
  AlertTriangle,
  HelpCircle,
  Bell,
  MessageSquare,
  CheckCircle2
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../i18n/useLang'
import * as parentApi from '../../services/parentApi'

export default function PortalLayout() {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isSlowNetwork, setIsSlowNetwork] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [reminders, setReminders] = useState([])
  const menuRef = useRef(null)
  const notifRef = useRef(null)

  // Mask parent phone for privacy (e.g. +91 98*****001)
  const rawPhone = user?.phone || ''
  const maskedPhone = rawPhone.length >= 10
    ? `+91 ${rawPhone.slice(0, 2)}*****${rawPhone.slice(-3)}`
    : rawPhone ? `+91 ${rawPhone}` : '—'

  // Fetch parent students on mount
  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
      if (isMounted) setIsSlowNetwork(true)
    }, 3000)

    async function fetchStudents() {
      try {
        setIsLoadingStudents(true)
        setLoadError(null)
        const res = await parentApi.getParentStudents()
        if (!isMounted) return

        const studentList = Array.isArray(res) ? res : res?.students || []
        setStudents(studentList)

        // Select student from URL query if present, otherwise default to first student
        const urlStudentId = searchParams.get('student')
        if (urlStudentId && studentList.some((s) => s.studentId === urlStudentId)) {
          setSelectedStudentId(urlStudentId)
        } else if (studentList.length > 0) {
          const firstId = studentList[0].studentId
          setSelectedStudentId(firstId)
          // Update URL without adding new history entry
          const newParams = new URLSearchParams(searchParams)
          newParams.set('student', firstId)
          navigate({ search: newParams.toString() }, { replace: true })
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err.message || 'Unable to load student information.')
        }
      } finally {
        clearTimeout(timer)
        if (isMounted) {
          setIsLoadingStudents(false)
          setIsSlowNetwork(false)
        }
      }
    }

    fetchStudents()

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [])

  // Sync selectedStudentId when URL parameter changes
  useEffect(() => {
    const urlStudentId = searchParams.get('student')
    if (urlStudentId && urlStudentId !== selectedStudentId && students.some((s) => s.studentId === urlStudentId)) {
      setSelectedStudentId(urlStudentId)
    }
  }, [searchParams, students])

  // Switch active child
  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('student', studentId)
    navigate({ search: newParams.toString() }, { replace: true })
  }

  // Fetch student reminders when selectedStudentId changes
  useEffect(() => {
    if (!selectedStudentId) return
    let isMounted = true
    parentApi.getStudentReminders(selectedStudentId)
      .then((res) => {
        if (isMounted) setReminders(Array.isArray(res) ? res : res?.reminders || [])
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [selectedStudentId])

  // Close avatar dropdown or notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }
    if (menuOpen || notifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen, notifOpen])

  const activeStudent = students.find((s) => s.studentId === selectedStudentId) || students[0] || null

  const pt = t.portal || {}
  const navT = pt.nav || {
    dues: 'Dues',
    receipts: 'Receipts',
    progress: 'Progress',
    signOut: 'Sign out',
    refundPolicy: 'Refund policy',
    privacy: 'Privacy',
    contactCentre: 'Contact the centre',
    reminderLanguage: 'Reminder language',
    registeredPhone: 'Registered phone',
  }

  // Build target paths preserving child query param
  const getTabUrl = (path) => {
    return selectedStudentId ? `${path}?student=${selectedStudentId}` : path
  }

  const isDuesActive = location.pathname === '/portal' || location.pathname === '/portal/'
  const isReceiptsActive = location.pathname.startsWith('/portal/receipts')
  const isProgressActive = location.pathname.startsWith('/portal/progress')
  const isSupportActive = location.pathname.startsWith('/portal/support')

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#14211F] flex flex-col font-sans selection:bg-[#E6F0EE] selection:text-[#0E4D44]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#E7E3DA]">
        <div className="max-w-[720px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo Mark + Wordmark */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4D44] rounded-lg"
            aria-label="FeeDesk Home"
          >
            <svg
              viewBox="0 0 32 32"
              width="28"
              height="28"
              fill="none"
              className="flex-shrink-0"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="8" fill="#0E4D44" />
              <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
              <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
              <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
              <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
            </svg>
            <span className="font-serif font-semibold text-[1.125rem] tracking-tight text-[#14211F]">
              FeeDesk
            </span>
          </Link>

            {/* Right Controls: Language toggle + Notifications Bell + User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle: EN / हिं */}
            <div 
              className="inline-flex items-center border border-[#E7E3DA] rounded-md overflow-hidden bg-white text-xs font-medium"
              role="group"
              aria-label="Language selection"
            >
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

            {/* SMS Reminders & Notification Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full border border-[#E7E3DA] bg-white text-[#4A5654] hover:text-[#0E4D44] hover:border-[#0E4D44] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4D44] transition-all"
                aria-label="SMS Reminders and Notifications"
                aria-expanded={notifOpen}
              >
                <Bell size={16} />
                {reminders.some((r) => r.status === 'sent' || r.status === 'scheduled') && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D98A1E] ring-2 ring-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E7E3DA] shadow-xl py-3 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 pb-2.5 border-b border-[#E7E3DA] flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-[#14211F]">SMS Reminders & Alerts</h4>
                      <p className="text-[11px] text-[#7A8582]">Sent to registered {maskedPhone}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#E6F0EE] text-[#0E4D44]">
                      Automated
                    </span>
                  </div>

                  <div className="p-3 max-h-60 overflow-y-auto space-y-2">
                    {reminders.length === 0 ? (
                      <p className="text-[#7A8582] text-center py-4">No recent SMS reminders logged.</p>
                    ) : (
                      reminders.map((rem, idx) => (
                        <div key={rem._id || idx} className="p-2.5 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-[#14211F]">
                              Instalment #{rem.sequence} Notice
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              rem.status === 'sent' ? 'bg-[#E8F4EC] text-[#1F7A4D]' : rem.status === 'skipped_paid' ? 'bg-[#E6F0EE] text-[#0E4D44]' : 'bg-[#FFF4E0] text-[#9A5B0B]'
                            }`}>
                              {rem.status === 'sent' ? 'Sent' : rem.status === 'skipped_paid' ? 'Stopped (Paid)' : 'Scheduled'}
                            </span>
                          </div>
                          <p className="text-[#7A8582] text-[11px] leading-tight">
                            {rem.messagePreview || 'FeeDesk reminder sent via SMS to parent mobile.'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 pt-2 border-t border-[#E7E3DA] text-[11px] text-[#7A8582] text-center">
                    Reminders repeat every 3 days until paid and stop immediately upon payment.
                  </div>
                </div>
              )}
            </div>

            {/* Quick Support & Policies Link */}
            <Link
              to={getTabUrl('/portal/support')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-medium transition-colors ${
                isSupportActive 
                  ? 'bg-[#0E4D44] text-[#FAF8F4] border-[#0E4D44] font-semibold' 
                  : 'border-[#E7E3DA] bg-white text-[#4A5654] hover:border-[#0E4D44] hover:text-[#0E4D44]'
              }`}
            >
              <HelpCircle size={13} />
              <span>{navT.supportShort || 'Support'}</span>
            </Link>

            {/* Avatar Button & Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 p-1.5 rounded-full border border-[#E7E3DA] bg-white hover:border-[#0E4D44] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4D44] transition-all"
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="Parent account menu"
              >
                <div className="w-7 h-7 rounded-full bg-[#E6F0EE] text-[#0E4D44] font-serif font-semibold text-xs flex items-center justify-center">
                  {(user?.name || 'P').charAt(0).toUpperCase()}
                </div>
                <ChevronDown size={14} className={`text-[#7A8582] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#E7E3DA] shadow-lg py-2 z-50 text-sm animate-in fade-in slide-in-from-top-1 duration-150"
                  role="menu"
                >
                  {/* User Profile summary */}
                  <div className="px-4 py-3 border-b border-[#E7E3DA]">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0E4D44] uppercase tracking-wider mb-0.5">
                      <ShieldCheck size={14} />
                      <span>Verified Parent</span>
                    </div>
                    <div className="font-serif font-medium text-base text-[#14211F] truncate">
                      {user?.name || 'Parent Account'}
                    </div>
                    <div className="text-xs text-[#7A8582] mt-0.5 flex items-center gap-1.5">
                      <Phone size={12} />
                      <span className="font-mono">{maskedPhone}</span>
                    </div>
                  </div>

                  {/* Menu details */}
                  <div className="px-4 py-2 text-xs text-[#7A8582] border-b border-[#E7E3DA] flex items-center justify-between">
                    <span>{navT.reminderLanguage}</span>
                    <span className="font-medium text-[#14211F]">{lang === 'hi' ? 'हिंदी (Hindi)' : 'English'}</span>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    <Link
                      to="/refund-policy"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-[#4A5654] hover:bg-[#FAF8F4] hover:text-[#14211F] transition-colors"
                      role="menuitem"
                    >
                      {navT.refundPolicy}
                    </Link>
                    <Link
                      to="/privacy"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-[#4A5654] hover:bg-[#FAF8F4] hover:text-[#14211F] transition-colors"
                      role="menuitem"
                    >
                      {navT.privacy}
                    </Link>
                    <a
                      href="tel:+911412550100"
                      className="block px-4 py-2 text-[#4A5654] hover:bg-[#FAF8F4] hover:text-[#14211F] transition-colors"
                      role="menuitem"
                    >
                      {navT.contactCentre}
                    </a>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-[#E7E3DA] pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                      }}
                      className="w-full text-left px-4 py-2 text-red-700 hover:bg-red-50 flex items-center gap-2 font-medium transition-colors"
                      role="menuitem"
                    >
                      <LogOut size={15} />
                      <span>{navT.signOut}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Top Tabs: Dues, Receipts, Progress (centred, max 720px) */}
        <div className="hidden md:block border-t border-[#E7E3DA] bg-white">
          <div className="max-w-[720px] mx-auto px-4 flex items-center gap-1">
            <Link
              to={getTabUrl('/portal')}
              className={`py-3 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                isDuesActive
                  ? 'border-[#0E4D44] text-[#0E4D44] font-semibold'
                  : 'border-transparent text-[#7A8582] hover:text-[#14211F] hover:border-[#E7E3DA]'
              }`}
            >
              <CreditCard size={17} strokeWidth={1.5} />
              <span>{navT.dues}</span>
            </Link>

            <Link
              to={getTabUrl('/portal/receipts')}
              className={`py-3 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                isReceiptsActive
                  ? 'border-[#0E4D44] text-[#0E4D44] font-semibold'
                  : 'border-transparent text-[#7A8582] hover:text-[#14211F] hover:border-[#E7E3DA]'
              }`}
            >
              <FileText size={17} strokeWidth={1.5} />
              <span>{navT.receipts}</span>
            </Link>

            <Link
              to={getTabUrl('/portal/progress')}
              className={`py-3 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                isProgressActive
                  ? 'border-[#0E4D44] text-[#0E4D44] font-semibold'
                  : 'border-transparent text-[#7A8582] hover:text-[#14211F] hover:border-[#E7E3DA]'
              }`}
            >
              <GraduationCap size={17} strokeWidth={1.5} />
              <span>{navT.progress}</span>
            </Link>

            <Link
              to={getTabUrl('/portal/support')}
              className={`py-3 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                isSupportActive
                  ? 'border-[#0E4D44] text-[#0E4D44] font-semibold'
                  : 'border-transparent text-[#7A8582] hover:text-[#14211F] hover:border-[#E7E3DA]'
              }`}
            >
              <HelpCircle size={17} strokeWidth={1.5} />
              <span>{navT.support || 'Support & Policies'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Slow network indicator banner */}
      {isSlowNetwork && (
        <div className="bg-[#FFF4E0] border-b border-[#E7E3DA] px-4 py-2 text-xs text-[#9A5B0B] text-center flex items-center justify-center gap-2">
          <AlertTriangle size={14} className="text-[#9A5B0B] flex-shrink-0" />
          <span>{pt.slowNetwork || 'Loading data... Slow connection detected.'}</span>
        </div>
      )}

      {/* Main Column (Max-width 720px, centred) */}
      <main className="flex-1 w-full max-w-[720px] mx-auto px-4 py-5 md:py-8 pb-24 md:pb-12">
        {/* Child Switcher Pills (shown when parent has > 1 child) */}
        {students.length > 1 && (
          <div className="mb-6 bg-white p-2 rounded-xl border border-[#E7E3DA] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-medium text-[#7A8582] uppercase tracking-wider pl-2 pr-1 flex-shrink-0">
              {pt.selectChild || 'Student'}:
            </span>
            {students.map((student) => {
              const isSelected = student.studentId === selectedStudentId
              const firstName = student.name?.split(' ')[0] || student.name
              return (
                <button
                  key={student.studentId}
                  type="button"
                  onClick={() => handleSelectStudent(student.studentId)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0E4D44] text-[#FAF8F4] shadow-sm font-semibold'
                      : 'bg-[#FAF8F4] text-[#4A5654] hover:bg-[#E6F0EE] hover:text-[#0E4D44] border border-[#E7E3DA]'
                  }`}
                >
                  <span>{firstName}</span>
                  <span className={`text-[11px] ${isSelected ? 'text-[#FAF8F4]/80' : 'text-[#7A8582]'}`}>
                    • {student.batch || student.course}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Load error state */}
        {loadError && (
          <div className="p-4 rounded-xl bg-[#FDECEA] border border-[#B3261E]/20 text-[#B3261E] text-sm mb-6 flex items-start gap-3">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{loadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Child View rendered via React Router Outlet with layout context */}
        <Outlet 
          context={{
            students,
            activeStudent,
            selectedStudentId,
            isLoadingStudents,
          }} 
        />

        {/* Footer line on each page */}
        <footer className="mt-12 pt-6 border-t border-[#E7E3DA] text-center text-xs text-[#7A8582] flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link to="/refund-policy" className="hover:text-[#14211F] transition-colors underline-offset-2 hover:underline">
            {navT.refundPolicy}
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/privacy" className="hover:text-[#14211F] transition-colors underline-offset-2 hover:underline">
            {navT.privacy}
          </Link>
          <span aria-hidden="true">·</span>
          <a href="tel:+911412550100" className="hover:text-[#14211F] transition-colors underline-offset-2 hover:underline">
            {navT.contactCentre}
          </a>
        </footer>
      </main>

      {/* Mobile Bottom Tab Bar (under 768px, 56px tall, fixed bottom) */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E7E3DA] z-40 px-3 flex items-center justify-around shadow-sm"
        aria-label="Mobile Bottom Navigation"
      >
        <Link
          to={getTabUrl('/portal')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isDuesActive ? 'text-[#0E4D44] font-semibold' : 'text-[#7A8582] hover:text-[#14211F]'
          }`}
          aria-current={isDuesActive ? 'page' : undefined}
        >
          <CreditCard size={18} strokeWidth={isDuesActive ? 2 : 1.5} />
          <span className="text-[11px] mt-0.5 tracking-tight">{navT.dues}</span>
        </Link>

        <Link
          to={getTabUrl('/portal/receipts')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isReceiptsActive ? 'text-[#0E4D44] font-semibold' : 'text-[#7A8582] hover:text-[#14211F]'
          }`}
          aria-current={isReceiptsActive ? 'page' : undefined}
        >
          <FileText size={18} strokeWidth={isReceiptsActive ? 2 : 1.5} />
          <span className="text-[11px] mt-0.5 tracking-tight">{navT.receipts}</span>
        </Link>

        <Link
          to={getTabUrl('/portal/progress')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isProgressActive ? 'text-[#0E4D44] font-semibold' : 'text-[#7A8582] hover:text-[#14211F]'
          }`}
          aria-current={isProgressActive ? 'page' : undefined}
        >
          <GraduationCap size={18} strokeWidth={isProgressActive ? 2 : 1.5} />
          <span className="text-[11px] mt-0.5 tracking-tight">{navT.progress}</span>
        </Link>

        <Link
          to={getTabUrl('/portal/support')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isSupportActive ? 'text-[#0E4D44] font-semibold' : 'text-[#7A8582] hover:text-[#14211F]'
          }`}
          aria-current={isSupportActive ? 'page' : undefined}
        >
          <HelpCircle size={18} strokeWidth={isSupportActive ? 2 : 1.5} />
          <span className="text-[11px] mt-0.5 tracking-tight">{navT.supportShort || 'Support'}</span>
        </Link>
      </nav>
    </div>
  )
}
