import { useState } from 'react'
import {
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Bell,
  Sparkles,
  Info,
  Loader2,
  X,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../i18n/useLang'

function getTimeAgo(dateInput) {
  if (!dateInput) return 'Never'
  const date = new Date(dateInput)
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  return `${diffDays}d ago`
}

export default function JobsView() {
  const { showToast } = useAuth()
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [runningJobName, setRunningJobName] = useState(null)
  const [confirmJob, setConfirmJob] = useState(null) // job object

  const { data: jobs, isLoading, error, refetch } = useApi(() => adminApi.getJobs(), [])

  const handleTriggerRun = async () => {
    if (!confirmJob) return
    const name = confirmJob.name
    setConfirmJob(null)
    setRunningJobName(name)
    try {
      const res = await adminApi.runJob(name)
      showToast(
        isHindi
          ? `${confirmJob.title} सफलतापूर्वक चला!`
          : `Job ${confirmJob.title} completed successfully!`,
        'success'
      )
      refetch()
    } catch (err) {
      showToast(err.message || 'Job execution failed', 'error')
    } finally {
      setRunningJobName(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
            {isHindi ? 'स्वचालन व बैकग्राउंड जॉब्स' : 'Background Automation Jobs'}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1 font-medium">
            {isHindi
              ? 'रिमाइंडर शेड्यूलर तथा एआई ड्रॉपआउट जोखिम गणना का वास्तविक समय नियंत्रण'
              : 'Monitor automated schedules, inspect execution metrics, and trigger on-demand runs.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#0E4D44]' : ''} />
          <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          STATUTORY MANDATE NOTE
         ────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-start gap-3">
        <Info size={18} className="text-[#0E4D44] shrink-0 mt-0.5" />
        <div className="text-xs text-[#4A5654] leading-relaxed">
          <strong className="text-[#14211F]">Important Safety Boundaries:</strong>{' '}
          {isHindi
            ? 'रिमाइंडर देय राशि का भुगतान होते ही तुरंत स्वतः बंद हो जाते हैं। ड्रॉपआउट जोखिम स्कोर केवल काउंसलर कॉल कार्य उत्पन्न करते हैं; वे कभी भी अभिभावकों को संदेश नहीं भेजते और न ही फीस में कोई परिवर्तन करते हैं।'
            : 'Reminders stop the moment a payment is recorded. Risk flags only create call tasks; they never message parents or change fees.'}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          JOB CARDS GRID
         ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="h-64 bg-white border border-[#E7E3DA] rounded-2xl p-6" />
          <div className="h-64 bg-white border border-[#E7E3DA] rounded-2xl p-6" />
        </div>
      ) : error ? (
        <div className="p-12 text-center text-xs text-[#B3261E] bg-white border border-[#B3261E]/30 rounded-2xl space-y-2">
          <AlertCircle size={20} className="mx-auto" />
          <div>Failed to load background jobs: {error.message}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(jobs || []).map((job) => {
            const isRunning = runningJobName === job.name
            const lastRun = job.lastRun

            return (
              <div
                key={job.name}
                className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-xs flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center shrink-0">
                        {job.name === 'reminders' ? <Bell size={18} /> : <Activity size={18} />}
                      </div>
                      <div>
                        <h2 className="font-serif font-bold text-base text-[#14211F]">
                          {job.title}
                        </h2>
                        <div className="text-[11px] text-[#7A8582]">
                          Job ID: <code className="font-mono">{job.name}</code>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        lastRun?.status === 'success'
                          ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                          : lastRun?.status === 'failed'
                          ? 'bg-[#FDECEA] text-[#B3261E]'
                          : 'bg-[#FFF4E0] text-[#9A5B0B]'
                      }`}
                    >
                      {lastRun?.status === 'success' ? (
                        <CheckCircle2 size={11} />
                      ) : lastRun?.status === 'failed' ? (
                        <XCircle size={11} />
                      ) : (
                        <Clock size={11} />
                      )}
                      <span className="capitalize">{lastRun?.status || 'Ready'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#4A5654] leading-relaxed">
                    {job.description}
                  </p>

                  {/* Schedule Box */}
                  <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A8582]">Cron Schedule</span>
                      <span className="font-medium text-[#14211F]">{job.schedule}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A8582]">Last Executed</span>
                      <span className="font-medium text-[#14211F]">
                        {getTimeAgo(lastRun?.finishedAt || lastRun?.startedAt)}
                      </span>
                    </div>
                    {lastRun?.durationMs > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#7A8582]">Execution Duration</span>
                        <span className="font-mono text-[11px] text-[#14211F]">
                          {lastRun.durationMs}ms
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Latest Metrics Preview */}
                  {lastRun?.resultSummary && (
                    <div className="p-3 rounded-xl bg-[#E6F0EE]/50 border border-[#0E4D44]/10 text-xs text-[#0E4D44] space-y-1">
                      <div className="font-semibold text-[11px] uppercase tracking-wider">
                        Last Run Metrics
                      </div>
                      <p className="text-xs leading-snug">
                        {lastRun.resultSummary}
                      </p>
                    </div>
                  )}

                  {/* Job Note */}
                  <div className="text-[11px] text-[#7A8582] italic">
                    Note: {job.note}
                  </div>
                </div>

                {/* Run Now Trigger Action */}
                <div className="pt-3 border-t border-[#E7E3DA]">
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => setConfirmJob(job)}
                    className="w-full h-11 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Running job now...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        <span>Run Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: CONFIRM MANUAL JOB RUN
         ────────────────────────────────────────────────────────── */}
      {confirmJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14211F]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E3DA]">
              <h3 className="font-serif font-bold text-lg text-[#14211F]">
                Run {confirmJob.title}?
              </h3>
              <button
                type="button"
                onClick={() => setConfirmJob(null)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#4A5654] leading-relaxed">
              This will manually execute the <strong className="text-[#14211F]">{confirmJob.title}</strong> routine right now across all active cohorts. The run will be logged in the Job Run ledger and the Audit Log.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
              <button
                type="button"
                onClick={() => setConfirmJob(null)}
                className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerRun}
                className="h-9 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Play size={13} />
                <span>Confirm & Run Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
