import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Info,
  PhoneCall,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Loader2,
  Phone,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/useAuth'
import * as staffApi from '../../services/staffApi'
import { maskPhone } from '../../utils/format'
import { useLang } from '../../i18n/useLang'

const CENTRES = ['ALL', 'Jaipur Main', 'Jaipur South', 'Kota', 'Sikar']

export default function RiskFlagsView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const { showToast } = useAuth()

  // Filters
  const [statusFilter, setStatusFilter] = useState('open')
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [centreFilter, setCentreFilter] = useState('ALL')

  // Rule Explainer Drawer State
  const [showInfoDrawer, setShowInfoDrawer] = useState(false)

  // Phone Reveal Map: { [studentId]: countdownNumber }
  const [revealedPhones, setRevealedPhones] = useState({})

  // Action Confirmation Modal State
  const [activeActionModal, setActiveActionModal] = useState(null) // { type: 'contacted'|'false-flag'|'resolve', flag }
  const [actionNote, setActionNote] = useState('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  // Fetch Risk Flags
  const {
    data: flags,
    isLoading,
    refetch,
  } = useApi(
    () =>
      staffApi.getRiskFlags({
        status: statusFilter,
        level: levelFilter,
        centre: centreFilter,
      }),
    [statusFilter, levelFilter, centreFilter]
  )

  // 10s Reveal Timer Countdown
  useEffect(() => {
    const keys = Object.keys(revealedPhones)
    if (keys.length === 0) return

    const interval = setInterval(() => {
      setRevealedPhones((prev) => {
        const next = { ...prev }
        let changed = false
        for (const k of Object.keys(next)) {
          if (next[k] > 1) {
            next[k] -= 1
            changed = true
          } else {
            delete next[k]
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [revealedPhones])

  const toggleRevealPhone = (studentId) => {
    setRevealedPhones((prev) => {
      if (prev[studentId]) {
        const next = { ...prev }
        delete next[studentId]
        return next
      }
      return { ...prev, [studentId]: 10 }
    })
  }

  // Execute Workflow Action
  const handleExecuteAction = async () => {
    if (!activeActionModal) return
    const { type, flag } = activeActionModal

    if (type === 'false-flag' && !actionNote.trim()) {
      showToast(isHindi ? 'गलत फ़्लैग दर्ज करने के लिए कारण आवश्यक है।' : 'Note is required to mark as false flag.', 'error')
      return
    }

    setIsSubmittingAction(true)
    try {
      if (type === 'contacted') {
        await staffApi.markRiskFlagContacted(flag._id, { note: actionNote })
        showToast(isHindi ? 'अभिभावक कॉल संपर्क दर्ज हुआ।' : 'Call task marked as completed with parent.', 'success')
      } else if (type === 'false-flag') {
        await staffApi.markRiskFlagFalse(flag._id, { note: actionNote.trim() })
        showToast(isHindi ? 'गलत फ़्लैग दर्ज हुआ (30 दिन तक पुनः सक्रिय नहीं होगा)।' : 'Flag marked false (suppressed for 30 days).', 'info')
      } else if (type === 'resolve') {
        await staffApi.resolveRiskFlag(flag._id)
        showToast(isHindi ? 'जोखिम फ़्लैग समाधान संपन्न।' : 'Risk flag resolved.', 'success')
      }
      setActiveActionModal(null)
      setActionNote('')
      refetch()
    } catch (err) {
      showToast(err.message || (isHindi ? 'कार्यवाही विफल' : 'Action failed'), 'error')
    } finally {
      setIsSubmittingAction(false)
    }
  }

  // Generate Talking Points from Reasons
  const getTalkingPoints = (reasons) => {
    if (!reasons || reasons.length === 0) {
      return 'Check in on academic progress, batch engagement, and any fee installment assistance.'
    }
    const points = reasons.map((r) => r.label).join(' • ')
    return `Discussion topics: ${points}. Ask if extra mentoring or installment restructuring is needed.`
  }

  // Sort by score descending
  const sortedFlags = (flags || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0))

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
              {isHindi ? 'कॉल टास्क (ड्रॉपआउट जोखिम फ़्लैग)' : 'Call Tasks (Dropout Risk)'}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#B3261E]">
              {sortedFlags.length} {isHindi ? 'सक्रिय कार्य' : 'active tasks'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1 font-medium">
            {isHindi
              ? 'कॉल टास्क कभी भी स्वचालित संदेश नहीं भेजते या फीस नहीं बदलते। एक काउंसलर निर्णय लेता है।'
              : 'Call tasks never send messages or change fees. A counsellor decides what to do.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowInfoDrawer(true)}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs"
          >
            <Info size={14} />
            <span>{isHindi ? 'स्कोरिंग नियम' : 'How is score built?'}</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#0E4D44]' : ''} />
            <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          FILTER BAR
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 sm:p-5 shadow-xs flex flex-wrap items-center gap-3">
        {/* Status */}
        <div className="flex items-center gap-2">
          <label htmlFor="f-status" className="text-xs font-semibold text-[#7A8582]">
            {isHindi ? 'स्थिति:' : 'Status:'}
          </label>
          <select
            id="f-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          >
            <option value="open">{isHindi ? 'खुले (Open Tasks)' : 'Open tasks'}</option>
            <option value="contacted">{isHindi ? 'संपर्क संपन्न (Contacted)' : 'Contacted'}</option>
            <option value="false_flag">{isHindi ? 'गलत फ़्लैग (False Flag)' : 'False flag'}</option>
            <option value="resolved">{isHindi ? 'समाधान (Resolved)' : 'Resolved'}</option>
            <option value="ALL">{isHindi ? 'सभी' : 'All'}</option>
          </select>
        </div>

        {/* Level */}
        <div className="flex items-center gap-2">
          <label htmlFor="f-level" className="text-xs font-semibold text-[#7A8582]">
            {isHindi ? 'जोखिम स्तर:' : 'Risk Level:'}
          </label>
          <select
            id="f-level"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          >
            <option value="ALL">{isHindi ? 'सभी स्तर' : 'All levels'}</option>
            <option value="high">{isHindi ? 'उच्च (High)' : 'High (70+)'}</option>
            <option value="medium">{isHindi ? 'मध्यम (Medium)' : 'Medium (40-69)'}</option>
            <option value="low">{isHindi ? 'निम्न (Low)' : 'Low (<40)'}</option>
          </select>
        </div>

        {/* Centre */}
        <div className="flex items-center gap-2">
          <label htmlFor="f-centre" className="text-xs font-semibold text-[#7A8582]">
            {isHindi ? 'केंद्र:' : 'Centre:'}
          </label>
          <select
            id="f-centre"
            value={centreFilter}
            onChange={(e) => setCentreFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          >
            {CENTRES.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? (isHindi ? 'सभी केंद्र' : 'All centres') : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          CALL TASKS LIST CARDS
         ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-12 text-center text-[#7A8582]">
            <RefreshCw size={18} className="animate-spin inline-block mr-2 text-[#0E4D44]" />
            <span>Loading risk call tasks...</span>
          </div>
        ) : sortedFlags.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-12 text-center space-y-2 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <div className="font-serif font-bold text-lg text-[#14211F]">
              {isHindi ? 'कोई खुला कॉल टास्क नहीं' : 'No open call tasks.'}
            </div>
            <div className="text-xs text-[#7A8582]">
              All students have attendance, test scores, and fee schedules within healthy thresholds.
            </div>
          </div>
        ) : (
          sortedFlags.map((flag) => {
            const isRevealed = Boolean(revealedPhones[flag.studentId])
            const countdown = revealedPhones[flag.studentId] || 0
            const talkingPoints = getTalkingPoints(flag.reasons)

            return (
              <div
                key={flag._id}
                className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4 transition-all hover:border-[#0E4D44]/30"
              >
                {/* Top Row: Student & Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E3DA]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <Link
                        to={`/accounts/students/${encodeURIComponent(flag.studentId)}`}
                        className="font-serif font-bold text-lg text-[#14211F] hover:text-[#0E4D44] transition-colors"
                      >
                        {flag.studentName || flag.studentId}
                      </Link>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#FAF8F4] border border-[#E7E3DA] text-[#0E4D44]">
                        {flag.studentId}
                      </span>
                    </div>
                    <div className="text-xs text-[#7A8582] flex items-center gap-2">
                      <span>{flag.batch}</span>
                      <span>•</span>
                      <span>{flag.centre}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {/* Score badge */}
                    <div className="text-right">
                      <div className="text-[10px] text-[#7A8582] uppercase tracking-wider font-semibold">
                        Risk Score
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-2xl text-[#14211F] tabular-nums">
                          {flag.score}/100
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            flag.level === 'high'
                              ? 'bg-[#FDECEA] text-[#B3261E]'
                              : flag.level === 'medium'
                              ? 'bg-[#FFF4E0] text-[#9A5B0B]'
                              : 'bg-[#E8F4EC] text-[#1F7A4D]'
                          }`}
                        >
                          {flag.level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Phone & Factors */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Guardian Phone */}
                  <div className="md:col-span-4 p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-1">
                    <div className="text-[11px] font-semibold text-[#7A8582] flex items-center gap-1.5">
                      <Phone size={12} />
                      <span>Guardian Contact</span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="font-mono text-xs font-bold text-[#14211F]">
                        {isRevealed ? flag.guardianPhone : maskPhone(flag.guardianPhone)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRevealPhone(flag.studentId)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors ${
                          isRevealed
                            ? 'border-[#B3261E] bg-[#FDECEA] text-[#B3261E]'
                            : 'border-[#E7E3DA] bg-white text-[#4A5654] hover:border-[#0E4D44] hover:text-[#0E4D44]'
                        }`}
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff size={10} />
                            <span>{countdown}s</span>
                          </>
                        ) : (
                          <>
                            <Eye size={10} />
                            <span>Reveal</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Reasons as Chips */}
                  <div className="md:col-span-8 space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#7A8582]">
                      Contributing Factors:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {flag.reasons?.map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] text-xs text-[#14211F]"
                        >
                          <span>{r.label}</span>
                          <strong className="text-[#B3261E] font-mono text-[11px]">+{r.points}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggested Talking Points */}
                <div className="p-3 rounded-xl bg-[#FFF4E0]/60 border border-[#D98A1E]/30 text-xs text-[#9A5B0B] leading-relaxed">
                  <strong className="font-semibold text-[#7A4B0B]">Counsellor Talking Points: </strong>
                  <span>{talkingPoints}</span>
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-[#7A8582]">
                    Status: <span className="font-bold text-[#14211F] uppercase">{flag.status}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveActionModal({ type: 'contacted', flag })}
                      className="h-8 px-3 rounded-lg bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <PhoneCall size={12} />
                      <span>Mark Called</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveActionModal({ type: 'false-flag', flag })
                        setActionNote('')
                      }}
                      className="h-8 px-3 rounded-lg border border-[#E7E3DA] bg-white hover:bg-[#FDECEA] hover:border-[#B3261E] hover:text-[#B3261E] text-xs font-semibold text-[#4A5654] transition-colors"
                    >
                      False Flag
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveActionModal({ type: 'resolve', flag })}
                      className="h-8 px-3 rounded-lg border border-[#E7E3DA] bg-white hover:bg-[#E8F4EC] hover:border-[#1F7A4D] hover:text-[#1F7A4D] text-xs font-semibold text-[#4A5654] transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          ACTION CONFIRMATION MODAL
         ────────────────────────────────────────────────────────── */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs"
            onClick={() => !isSubmittingAction && setActiveActionModal(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E3DA]">
              <h3 className="font-serif font-bold text-lg text-[#14211F]">
                {activeActionModal.type === 'contacted'
                  ? 'Mark Guardian Called'
                  : activeActionModal.type === 'false-flag'
                  ? 'Mark as False Flag'
                  : 'Resolve Risk Flag'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#4A5654]">
              Student:{' '}
              <strong>
                {activeActionModal.flag.studentName || activeActionModal.flag.studentId}
              </strong>
            </p>

            <div>
              <label htmlFor="act-note" className="block text-xs font-semibold text-[#4A5654] mb-1">
                {activeActionModal.type === 'false-flag' ? (
                  <>
                    Reason Note <span className="text-[#B3261E]">* (Required)</span>
                  </>
                ) : (
                  'Counsellor Discussion Note (Optional)'
                )}
              </label>
              <textarea
                id="act-note"
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  activeActionModal.type === 'false-flag'
                    ? 'State why this is an invalid flag (e.g. approved medical leave)...'
                    : 'Notes from phone call with guardian...'
                }
                required={activeActionModal.type === 'false-flag'}
                className="w-full p-2.5 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setActiveActionModal(null)}
                className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:bg-[#FAF8F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleExecuteAction}
                className="h-9 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmittingAction && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          EXPLAINABLE SCORING DRAWER
         ────────────────────────────────────────────────────────── */}
      {showInfoDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs"
            onClick={() => setShowInfoDrawer(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-[#0E4D44]" />
                <h3 className="font-serif font-bold text-lg text-[#14211F]">
                  How the Risk Score is Built
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoDrawer(false)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-[#4A5654] space-y-3 leading-relaxed">
              <p>
                FeeDesk uses an <strong>explainable, deterministic rule engine</strong>, not a black-box AI. Scores range from 0 to 100 based on three verifiable pillars:
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4]">
                  <div className="font-semibold text-[#14211F]">1. Fee Delays (up to 40 pts)</div>
                  <div className="text-[11px] text-[#7A8582] mt-0.5">
                    • 1 instalment &gt;30 days overdue: +20 pts<br />
                    • 2 or more instalments overdue: +35 pts
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4]">
                  <div className="font-semibold text-[#14211F]">2. Classroom Attendance (up to 35 pts)</div>
                  <div className="text-[11px] text-[#7A8582] mt-0.5">
                    • 30-day attendance below 75%: +20 pts<br />
                    • 30-day attendance below 60%: +35 pts
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4]">
                  <div className="font-semibold text-[#14211F]">3. Test Score Trajectory (up to 25 pts)</div>
                  <div className="text-[11px] text-[#7A8582] mt-0.5">
                    • Two consecutive test score drops: +15 pts<br />
                    • Score drop exceeding 25% percentile: +25 pts
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#E6F0EE] text-[#0E4D44] text-[11px] font-medium">
                Ethical Guarantee: Call tasks never alter fee contracts or automatically expel students. They serve only as a guide for academic counsellors to reach out with support.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
