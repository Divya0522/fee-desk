import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  FileCode,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { useLang } from '../../i18n/useLang'
import { formatDate } from '../../utils/format'

export default function AuditLogView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const [searchParams, setSearchParams] = useSearchParams()

  const actorParam = searchParams.get('actor') || ''
  const actionParam = searchParams.get('action') || 'ALL'
  const entityParam = searchParams.get('entity') || 'ALL'
  const fromParam = searchParams.get('from') || ''
  const toParam = searchParams.get('to') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [expandedRowId, setExpandedRowId] = useState(null)

  // Fetch audit logs
  const {
    data: responseData,
    isLoading,
    error,
    refetch,
  } = useApi(
    () =>
      adminApi.getAuditLogs({
        actor: actorParam,
        action: actionParam,
        entity: entityParam,
        from: fromParam,
        to: toParam,
        page: pageParam,
        limit: 25,
      }),
    [actorParam, actionParam, entityParam, fromParam, toParam, pageParam]
  )

  const logs = Array.isArray(responseData) ? responseData : responseData?.data || []
  const pagination = responseData?.meta || {}

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val && val !== 'ALL') {
      next.set(key, val)
    } else {
      next.delete(key)
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  const toggleRow = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
            {isHindi ? 'ऑडिट लॉग व सिस्टम गतिविधि' : 'Audit Trail'}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1 font-medium">
            {isHindi
              ? 'प्रशासनिक परिवर्तनों, सुरक्षा आयोजनों और जॉब निष्पादनों का अपरिवर्तनीय इतिहास'
              : 'Immutable record of staff administration, security events, and background cron runs.'}
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
          FILTERS BAR
         ────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-[#E7E3DA] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Actor search */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7A8582] mb-1">
              Actor (Email / ID)
            </label>
            <input
              type="text"
              placeholder="e.g. staff@institute.com"
              value={actorParam}
              onChange={(e) => updateParam('actor', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7A8582] mb-1">
              Action
            </label>
            <select
              value={actionParam}
              onChange={(e) => updateParam('action', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#4A5654] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
            >
              <option value="ALL">All Actions</option>
              <option value="create_staff">create_staff</option>
              <option value="update_staff">update_staff</option>
              <option value="deactivate_staff">deactivate_staff</option>
              <option value="activate_staff">activate_staff</option>
              <option value="reset_password">reset_password</option>
              <option value="change_password">change_password</option>
              <option value="run_job">run_job</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7A8582] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromParam}
              onChange={(e) => updateParam('from', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-[#7A8582] mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toParam}
              onChange={(e) => updateParam('to', e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
            />
          </div>
        </div>

        {(actorParam || actionParam !== 'ALL' || fromParam || toParam) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#E7E3DA]/60 text-xs">
            <span className="text-[#7A8582]">Filters active</span>
            <button
              type="button"
              onClick={() => setSearchParams(new URLSearchParams())}
              className="font-semibold text-[#0E4D44] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          AUDIT TABLE
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-[#FAF8F4] rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-[#B3261E] space-y-2">
            <AlertCircle size={20} className="mx-auto" />
            <div>Failed to load audit logs: {error.message}</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#7A8582] space-y-2">
            <ScrollText size={24} className="mx-auto text-[#7A8582] opacity-40" />
            <div>No audit log entries match your filter criteria.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] text-[#7A8582] uppercase tracking-wider font-semibold border-b border-[#E7E3DA]">
                <tr>
                  <th scope="col" className="py-3.5 pl-6 pr-3">Timestamp</th>
                  <th scope="col" className="py-3.5 px-3">Actor</th>
                  <th scope="col" className="py-3.5 px-3">Action</th>
                  <th scope="col" className="py-3.5 px-3">Entity</th>
                  <th scope="col" className="py-3.5 px-3">Summary</th>
                  <th scope="col" className="py-3.5 pr-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]/60">
                {logs.map((log) => {
                  const isExpanded = expandedRowId === log._id
                  return (
                    <>
                      <tr
                        key={log._id}
                        onClick={() => toggleRow(log._id)}
                        className="hover:bg-[#FAF8F4] transition-colors cursor-pointer"
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 pl-6 pr-3 font-mono text-[11px] text-[#4A5654] tabular-nums whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : '—'}
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-3 font-medium text-[#14211F]">
                          <div className="max-w-[160px] truncate" title={log.actor || log.performedBy}>
                            {log.actor || log.performedBy || 'system'}
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#E6F0EE] text-[#0E4D44] border border-[#0E4D44]/10">
                            {log.action}
                          </span>
                        </td>

                        {/* Entity */}
                        <td className="py-3.5 px-3 text-[#4A5654] font-medium">
                          {log.entity}
                        </td>

                        {/* Summary */}
                        <td className="py-3.5 px-3 text-[#14211F] max-w-xs truncate">
                          {log.summary || `Changed ${log.entity}`}
                        </td>

                        {/* Expand toggle */}
                        <td className="py-3.5 pr-6 text-right text-[#7A8582]">
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E4D44]">
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable JSON Detail Row */}
                      {isExpanded && (
                        <tr key={`${log._id}-detail`} className="bg-[#FAF8F4]">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="bg-white rounded-xl border border-[#E7E3DA] p-4 space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-[#7A8582]">
                                <div className="flex items-center gap-1.5">
                                  <FileCode size={13} className="text-[#0E4D44]" />
                                  <span>Structured Audit Payload</span>
                                </div>
                                <span className="font-mono text-[10px]">ID: {log._id}</span>
                              </div>
                              <pre className="font-mono text-[11px] text-[#14211F] p-3 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] overflow-x-auto max-h-56 leading-relaxed select-all">
                                {JSON.stringify(
                                  {
                                    id: log._id,
                                    action: log.action,
                                    entity: log.entity,
                                    entityId: log.entityId,
                                    actor: log.actor || log.performedBy,
                                    summary: log.summary,
                                    details: log.details,
                                    ipAddress: log.ipAddress,
                                    createdAt: log.createdAt,
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#E7E3DA] bg-[#FAF8F4] text-xs">
            <span className="text-[#7A8582]">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => updateParam('page', String(pagination.page - 1))}
                className="px-3 py-1 rounded-lg border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateParam('page', String(pagination.page + 1))}
                className="px-3 py-1 rounded-lg border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
