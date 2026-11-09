import { useState, useMemo } from 'react'
import {
  Bell,
  Play,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  Smartphone,
  Send,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/useAuth'
import * as staffApi from '../../services/staffApi'
import { formatDate, formatReminderOffset } from '../../utils/format'
import Pagination from '../../components/common/Pagination'
import { useLang } from '../../i18n/useLang'

const CENTRES = ['ALL', 'Jaipur Main', 'Jaipur South', 'Kota', 'Sikar']

export default function RemindersView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const { showToast } = useAuth()

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [centreFilter, setCentreFilter] = useState('ALL')
  const [isRunningJob, setIsRunningJob] = useState(false)
  const [lastJobResult, setLastJobResult] = useState(null)

  // Preview State: Both popup modal & inline expand
  const [previewModalItem, setPreviewModalItem] = useState(null)
  const [expandedRowId, setExpandedRowId] = useState(null)

  // Pagination state (15 per page)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Fetch Reminders
  const {
    data: reminders,
    isLoading,
    refetch,
  } = useApi(
    () => staffApi.getRemindersList({ status: statusFilter, centre: centreFilter }),
    [statusFilter, centreFilter]
  )

  const handleRunJob = async () => {
    setIsRunningJob(true)
    setLastJobResult(null)

    try {
      const res = await staffApi.runRemindersJob()
      setLastJobResult(res)
      showToast(
        isHindi
          ? `रिमाइंडर जॉब पूर्ण! भेजे गए: ${res?.sentCount || 0}, चुकता होने से रोके गए: ${res?.skippedPaidCount || 0}`
          : `Reminders job completed! Sent: ${res?.sentCount || 0}, Skipped (paid): ${res?.skippedPaidCount || 0}`,
        'success'
      )
      refetch()
    } catch (err) {
      showToast(err.message || (isHindi ? 'जॉब निष्पादन विफल' : 'Failed to trigger reminders job'), 'error')
    } finally {
      setIsRunningJob(false)
    }
  }

  // Paginated Slicing
  const allReminders = reminders || []
  const totalPages = Math.ceil(allReminders.length / itemsPerPage) || 1
  const paginatedReminders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return allReminders.slice(start, start + itemsPerPage)
  }, [allReminders, currentPage])

  // Get human message preview text
  const getMessageContent = (item) => {
    if (!item) return ''
    if (item.messagePreview) return item.messagePreview
    if (item.message) return item.message

    const name = item.studentName || 'Student'
    const seq = item.sequence || 1
    if (item.language === 'hi') {
      return `नमस्ते, FeeDesk कोचिंग केंद्र से सूचना: ${name} की किस्त #${seq} देय है। कृपया https://feedesk.demo पर ऑनलाइन जमा करें। भुगतान होने पर यह सूचना स्वतः रद्द हो जाएगी।`
    }
    return `Dear Parent, fee instalment #${seq} for ${name} is due. Please settle online at https://feedesk.demo. This reminder stops automatically once paid.`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
              {isHindi ? 'रिमाइंडर स्वचालन व लॉग्स' : 'Reminders & Automation'}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F4EC] text-[#1F7A4D]">
              {isHindi ? 'स्वचालित शेड्यूलर' : 'Automated Cron'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1 font-medium">
            {isHindi
              ? 'देय तिथि से 7 और 3 दिन पहले, देय तिथि पर, तथा 3, 7 और 15 दिन बाद रिमाइंडर। भुगतान दर्ज होते ही स्वतः बंद।'
              : 'Reminders at 7, 3 days before, on the day, and 3, 7, 15 days after. They stop the moment a payment is recorded.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRunJob}
            disabled={isRunningJob}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            {isRunningJob ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>{isHindi ? 'निष्पादित हो रहा है...' : 'Running Job...'}</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>{isHindi ? 'रिमाइंडर जॉब चलाएं' : 'Run reminders now'}</span>
              </>
            )}
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
          CRON RUN RESULTS BANNER
         ────────────────────────────────────────────────────────── */}
      {lastJobResult && (
        <div className="p-4 rounded-2xl bg-[#E8F4EC] border border-[#1F7A4D]/30 space-y-1.5 text-xs text-[#1F7A4D] animate-in fade-in">
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{isHindi ? 'स्वचालित रिमाइंडर जॉब परिणाम:' : 'Reminders Job Execution Summary:'}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastJobResult(null)}
              className="text-[#1F7A4D] hover:opacity-70"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
            <div>Processed: {lastJobResult.scheduledCount ?? lastJobResult.processed ?? 0}</div>
            <div>Sent: {lastJobResult.sentCount ?? 0}</div>
            <div>Skipped (Paid): {lastJobResult.skippedPaidCount ?? 0}</div>
            <div>Skipped (No Opt-in): {lastJobResult.skippedNoOptinCount ?? 0}</div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          FILTER TOOLBAR
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="rem-status" className="text-xs font-semibold text-[#7A8582]">
              {isHindi ? 'स्थिति:' : 'Status:'}
            </label>
            <select
              id="rem-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
            >
              <option value="ALL">{isHindi ? 'सभी स्थितियाँ' : 'All status'}</option>
              <option value="scheduled">{isHindi ? 'शेड्यूल किया गया (Scheduled)' : 'Scheduled'}</option>
              <option value="sent">{isHindi ? 'भेजा गया (Sent)' : 'Sent'}</option>
              <option value="skipped_paid">{isHindi ? 'भुगतान होने से रोका गया (Stopped: paid)' : 'Stopped: paid'}</option>
              <option value="skipped_no_optin">{isHindi ? 'सहमति नहीं (Skipped: no opt-in)' : 'Skipped: no opt-in'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="rem-centre" className="text-xs font-semibold text-[#7A8582]">
              {isHindi ? 'केंद्र:' : 'Centre:'}
            </label>
            <select
              id="rem-centre"
              value={centreFilter}
              onChange={(e) => {
                setCentreFilter(e.target.value)
                setCurrentPage(1)
              }}
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

        {allReminders.length > 0 && (
          <div className="text-xs text-[#7A8582]">
            Total: <strong className="text-[#14211F] font-mono">{allReminders.length}</strong> reminder schedules
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          REMINDERS TABLE
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label="Reminders Schedule">
            <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
              <tr>
                <th scope="col" className="pb-3">
                  {isHindi ? 'विद्यार्थी' : 'Student'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'किस्त' : 'Instalment'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'शेड्यूल समय (Offset)' : 'Offset'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'भाषा' : 'Language'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'चैनल' : 'Channel'}
                </th>
                <th scope="col" className="pb-3 text-center">
                  {isHindi ? 'स्थिति' : 'Status'}
                </th>
                <th scope="col" className="pb-3 text-right">
                  {isHindi ? 'संदेश' : 'Preview'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DA]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A8582]">
                    <RefreshCw size={16} className="animate-spin inline-block mr-2 text-[#0E4D44]" />
                    <span>Loading reminder logs...</span>
                  </td>
                </tr>
              ) : paginatedReminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-[#7A8582] flex items-center justify-center">
                        <Bell size={20} />
                      </div>
                      <div className="font-serif font-bold text-base text-[#14211F]">
                        {isHindi ? 'कोई रिमाइंडर रिकॉर्ड नहीं मिला' : 'No reminder records found'}
                      </div>
                      <div className="text-xs text-[#7A8582]">
                        {isHindi
                          ? 'सक्रिय शुल्क किश्तों के शेड्यूल का मूल्यांकन करने के लिए ऊपर दिए गए रिमाइंडर जॉब को चलाएं।'
                          : 'Trigger the reminder job above to evaluate schedules across active fee instalments.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReminders.map((rem) => {
                  const isStoppedPaid = rem.status === 'skipped_paid'
                  const isExpanded = expandedRowId === rem._id
                  const offsetLabel = formatReminderOffset(rem, lang)

                  return (
                    <>
                      <tr key={rem._id} className="hover:bg-[#FAF8F4] transition-colors">
                        {/* Student */}
                        <td className="py-3.5 pr-2 font-medium text-[#14211F]">
                          <div>{rem.studentName || rem.studentId}</div>
                          <div className="font-mono text-[10px] text-[#7A8582]">{rem.studentId}</div>
                        </td>

                        {/* Instalment */}
                        <td className="py-3.5 pr-2 text-[#4A5654] font-mono">
                          Instalment #{rem.sequence || rem.instalmentSequence || 1}
                        </td>

                        {/* Offset */}
                        <td className="py-3.5 pr-2 text-[#4A5654] font-medium">
                          {offsetLabel}
                        </td>

                        {/* Language */}
                        <td className="py-3.5 pr-2 text-[#4A5654]">
                          {rem.language === 'hi' ? 'Hindi' : 'English'}
                        </td>

                        {/* Channel */}
                        <td className="py-3.5 pr-2 uppercase font-mono text-[11px] text-[#4A5654]">
                          {rem.channel || 'SMS'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-2 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isStoppedPaid
                                ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                                : rem.status === 'sent'
                                ? 'bg-[#E6F0EE] text-[#0E4D44]'
                                : rem.status === 'scheduled'
                                ? 'bg-[#FFF4E0] text-[#9A5B0B]'
                                : 'bg-[#FAF8F4] border border-[#E7E3DA] text-[#7A8582]'
                            }`}
                          >
                            {isStoppedPaid && <CheckCircle2 size={11} />}
                            <span>
                              {isStoppedPaid
                                ? 'Stopped: paid'
                                : rem.status === 'skipped_no_optin'
                                ? 'Skipped: no opt-in'
                                : rem.status}
                            </span>
                          </span>
                        </td>

                        {/* Preview Actions */}
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewModalItem(rem)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F4] hover:bg-[#E6F0EE] text-[#0E4D44] border border-[#E7E3DA] text-[11px] font-semibold transition-colors shadow-xs"
                            >
                              <MessageSquare size={12} />
                              <span>Preview</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedRowId(isExpanded ? null : rem._id)}
                              className="p-1 text-[#7A8582] hover:text-[#14211F]"
                              title={isExpanded ? 'Collapse inline' : 'Expand inline'}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline Expansion Drawer */}
                      {isExpanded && (
                        <tr key={`${rem._id}-preview`} className="bg-[#FAF8F4]/80">
                          <td colSpan={7} className="p-4 border-b border-[#E7E3DA]">
                            <div className="max-w-2xl bg-white p-3.5 rounded-xl border border-[#E7E3DA] space-y-1.5 shadow-xs">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-[#7A8582]">
                                <span className="flex items-center gap-1.5 text-[#0E4D44]">
                                  <Smartphone size={13} />
                                  <span>{rem.channel?.toUpperCase() || 'SMS'} • {rem.language === 'hi' ? 'हिन्दी' : 'English'}</span>
                                </span>
                                <span>Scheduled: {rem.scheduledFor ? formatDate(rem.scheduledFor, lang) : 'Immediate'}</span>
                              </div>
                              <p className="text-xs text-[#14211F] leading-relaxed font-sans">
                                {getMessageContent(rem)}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-2 border-t border-[#E7E3DA]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={allReminders.length}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          PREVIEW MESSAGE POPUP MODAL
         ────────────────────────────────────────────────────────── */}
      {previewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs"
            onClick={() => setPreviewModalItem(null)}
            aria-hidden="true"
          />

          <div
            className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#14211F]">
                    {isHindi ? 'रिमाइंडर संदेश पूर्वावलोकन' : 'Reminder Notification Preview'}
                  </h3>
                  <div className="text-[11px] text-[#7A8582]">
                    {previewModalItem.channel?.toUpperCase() || 'SMS'} Dispatch
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-xs">
              <div>
                <span className="text-[#7A8582]">Student: </span>
                <span className="font-semibold text-[#14211F]">
                  {previewModalItem.studentName || previewModalItem.studentId}
                </span>
              </div>
              <div>
                <span className="text-[#7A8582]">Offset: </span>
                <span className="font-medium text-[#14211F]">
                  {formatReminderOffset(previewModalItem, lang)}
                </span>
              </div>
              <div>
                <span className="text-[#7A8582]">Instalment: </span>
                <span className="font-medium text-[#14211F]">
                  Instalment #{previewModalItem.sequence || 1}
                </span>
              </div>
              <div>
                <span className="text-[#7A8582]">Status: </span>
                <span
                  className={`font-semibold capitalize ${
                    previewModalItem.status === 'skipped_paid'
                      ? 'text-[#1F7A4D]'
                      : previewModalItem.status === 'sent'
                      ? 'text-[#0E4D44]'
                      : 'text-[#9A5B0B]'
                  }`}
                >
                  {previewModalItem.status === 'skipped_paid' ? 'Stopped: paid' : previewModalItem.status}
                </span>
              </div>
            </div>

            {/* Phone Chat Bubble Message Preview */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-[#7A8582] uppercase tracking-wider">
                Delivered Message Body:
              </div>
              <div className="p-4 rounded-2xl bg-[#E6F0EE]/80 border border-[#0E4D44]/20 text-xs text-[#14211F] leading-relaxed relative">
                <div className="flex items-center gap-1.5 text-[10px] text-[#0E4D44] font-semibold mb-1">
                  <Send size={10} />
                  <span>FeeDesk Automated Gateway</span>
                </div>
                <p className="font-sans">
                  {getMessageContent(previewModalItem)}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="h-9 px-4 rounded-xl bg-[#0E4D44] text-white text-xs font-semibold hover:bg-[#0A3B34] transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
