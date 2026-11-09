import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCheck,
  Users2,
  CreditCard,
  PhoneCall,
  Bell,
  Database,
  Activity,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { useLang } from '../../i18n/useLang'
import { formatDate } from '../../utils/format'

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

export default function OverviewView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const { data, isLoading, error, refetch } = useApi(() => adminApi.getOverview(), [])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-8 w-48 bg-white border border-[#E7E3DA] rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[#E7E3DA] rounded-2xl p-4" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 h-64 bg-white border border-[#E7E3DA] rounded-2xl" />
          <div className="lg:col-span-6 h-64 bg-white border border-[#E7E3DA] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-[#B3261E]/30 rounded-2xl text-center space-y-3">
        <AlertCircle size={28} className="mx-auto text-[#B3261E]" />
        <h2 className="font-serif font-bold text-lg text-[#14211F]">
          {isHindi ? 'सिस्टम अवलोकन लोड करने में त्रुटि' : 'Failed to load system overview'}
        </h2>
        <p className="text-xs text-[#7A8582]">{error.message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E4D44] text-white text-xs font-semibold"
        >
          <RefreshCw size={13} />
          <span>{isHindi ? 'पुनः प्रयास करें' : 'Retry'}</span>
        </button>
      </div>
    )
  }

  const counts = data?.counts || {}
  const system = data?.system || {}
  const jobs = data?.jobs || {}
  const recentLogs = data?.recentAuditLogs || []

  const tiles = [
    {
      label: isHindi ? 'कुल विद्यार्थी' : 'Students',
      value: counts.students ?? 0,
      icon: Users,
    },
    {
      label: isHindi ? 'सक्रिय अभिभावक' : 'Active Parents',
      value: counts.activeParents ?? 0,
      icon: UserCheck,
    },
    {
      label: isHindi ? 'कुल स्टाफ़' : 'Staff Accounts',
      value: counts.staff ?? 0,
      sublabel: `${counts.activeStaff ?? 0} active`,
      icon: Users2,
    },
    {
      label: isHindi ? 'अमिलान भुगतान' : 'Open Payments Queue',
      value: counts.openPaymentsQueue ?? 0,
      highlight: (counts.openPaymentsQueue || 0) > 0,
      icon: CreditCard,
    },
    {
      label: isHindi ? 'कॉल कार्य (जोखिम)' : 'Open Call Tasks',
      value: counts.openCallTasks ?? 0,
      highlight: (counts.openCallTasks || 0) > 0,
      icon: PhoneCall,
    },
    {
      label: isHindi ? 'आज भेजे रिमाइंडर' : 'Reminders Sent Today',
      value: counts.remindersSentToday ?? 0,
      icon: Bell,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
            {isHindi ? 'सिस्टम अवलोकन' : 'System Overview'}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1 font-medium">
            {isHindi
              ? 'संस्थान स्तर पर उपयोगकर्ता, बैकग्राउंड जॉब्स और स्वास्थ्य नियंत्रण'
              : 'Institute-wide counts, system health, background jobs, and recent audit activity.'}
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
          PLAIN COUNT TILES (NO GRADIENTS, NO GLOW, MINIMAL DENSE)
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {tiles.map((tile, idx) => {
          const Icon = tile.icon
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border bg-white shadow-xs transition-colors flex flex-col justify-between ${
                tile.highlight ? 'border-[#D98A1E]/50' : 'border-[#E7E3DA]'
              }`}
            >
              <div className="flex items-center justify-between text-[#7A8582]">
                <span className="text-[11px] font-semibold tracking-tight truncate">
                  {tile.label}
                </span>
                <Icon size={14} className="shrink-0 text-[#0E4D44]" />
              </div>
              <div className="mt-3">
                <div className="font-serif font-bold text-2xl text-[#14211F] tabular-nums">
                  {tile.value}
                </div>
                {tile.sublabel && (
                  <div className="text-[10px] text-[#7A8582] font-medium mt-0.5">
                    {tile.sublabel}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────
          TWO-COLUMN GRID: SYSTEM HEALTH & BACKGROUND JOBS
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* System & Jobs Status Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[#0E4D44]" />
                <h2 className="font-serif font-bold text-base text-[#14211F]">
                  {isHindi ? 'सिस्टम व डेटाबेस स्थिति' : 'System & DB Health'}
                </h2>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  system.dbStatus === 'connected'
                    ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                    : 'bg-[#FDECEA] text-[#B3261E]'
                }`}
              >
                {system.dbStatus === 'connected' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                <span className="capitalize">{system.dbStatus}</span>
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#E7E3DA]/60">
                <span className="text-[#7A8582]">Host Cluster</span>
                <span className="font-mono font-medium text-[#14211F] truncate max-w-[200px]">
                  {system.dbHost}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E7E3DA]/60">
                <span className="text-[#7A8582]">Backend Uptime</span>
                <span className="font-mono font-medium text-[#14211F] tabular-nums">
                  {Math.floor(system.uptimeSec / 60)} minutes
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E7E3DA]/60">
                <span className="text-[#7A8582]">Server Timestamp</span>
                <span className="font-mono text-[11px] text-[#4A5654] tabular-nums">
                  {system.serverTime ? new Date(system.serverTime).toLocaleTimeString('en-IN') : '—'}
                </span>
              </div>
            </div>

            {/* Background Jobs Run status */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-[#0E4D44]" />
                  <h3 className="font-serif font-bold text-sm text-[#14211F]">
                    {isHindi ? 'जॉब्स की अंतिम स्थिति' : 'Background Jobs Status'}
                  </h3>
                </div>
                <Link
                  to="/admin/jobs"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E4D44] hover:underline"
                >
                  <span>{isHindi ? 'नियंत्रण' : 'Control'}</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

              {/* Reminders Job Item */}
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Reminders Cron</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      jobs.reminders?.status === 'success'
                        ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                        : jobs.reminders?.status === 'failed'
                        ? 'bg-[#FDECEA] text-[#B3261E]'
                        : 'bg-[#FFF4E0] text-[#9A5B0B]'
                    }`}
                  >
                    {jobs.reminders?.status || 'Never run'}
                  </span>
                </div>
                <div className="text-[11px] text-[#7A8582] flex items-center justify-between">
                  <span>Last run: {getTimeAgo(jobs.reminders?.finishedAt || jobs.reminders?.startedAt)}</span>
                  <span className="font-mono text-[10px]">{jobs.reminders?.durationMs ? `${jobs.reminders.durationMs}ms` : ''}</span>
                </div>
                {jobs.reminders?.resultSummary && (
                  <p className="text-[11px] text-[#4A5654] truncate">
                    {jobs.reminders.resultSummary}
                  </p>
                )}
              </div>

              {/* Risk Scoring Job Item */}
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Dropout Risk Engine</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      jobs.risk_scoring?.status === 'success'
                        ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                        : jobs.risk_scoring?.status === 'failed'
                        ? 'bg-[#FDECEA] text-[#B3261E]'
                        : 'bg-[#FFF4E0] text-[#9A5B0B]'
                    }`}
                  >
                    {jobs.risk_scoring?.status || 'Never run'}
                  </span>
                </div>
                <div className="text-[11px] text-[#7A8582] flex items-center justify-between">
                  <span>Last run: {getTimeAgo(jobs.risk_scoring?.finishedAt || jobs.risk_scoring?.startedAt)}</span>
                  <span className="font-mono text-[10px]">{jobs.risk_scoring?.durationMs ? `${jobs.risk_scoring.durationMs}ms` : ''}</span>
                </div>
                {jobs.risk_scoring?.resultSummary && (
                  <p className="text-[11px] text-[#4A5654] truncate">
                    {jobs.risk_scoring.resultSummary}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Entries Card (10 items) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
              <div>
                <h2 className="font-serif font-bold text-base text-[#14211F]">
                  {isHindi ? 'हालिया ऑडिट लॉग (10 प्रविष्टियां)' : 'Recent Audit Activity'}
                </h2>
                <p className="text-[11px] text-[#7A8582]">
                  Immutable ledger of system administrative changes
                </p>
              </div>
              <Link
                to="/admin/audit"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E4D44] hover:underline"
              >
                <span>{isHindi ? 'पूरा लॉग देखें' : 'View full audit log'}</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7A8582]">
                No recent audit entries recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLogs.map((log) => {
                  return (
                    <div
                      key={log._id}
                      className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] hover:border-[#0E4D44]/30 transition-colors flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded-md bg-[#E6F0EE] text-[#0E4D44]">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-[#7A8582] truncate">
                            by <strong className="text-[#14211F]">{log.actor || log.performedBy || 'system'}</strong>
                          </span>
                        </div>
                        <p className="text-xs text-[#14211F] font-medium leading-snug">
                          {log.summary || `Modified ${log.entity} (${log.entityId || 'system'})`}
                        </p>
                      </div>

                      <div className="text-[10px] text-[#7A8582] whitespace-nowrap shrink-0 tabular-nums">
                        {getTimeAgo(log.createdAt)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
