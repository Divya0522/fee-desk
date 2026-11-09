import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Clock,
  Download,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Users,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import * as staffApi from '../../services/staffApi'
import {
  formatPaise,
  formatPaiseCompact,
  formatDaysOverdue,
  formatPercent,
  formatDate,
  getAgeingBucketLabel,
} from '../../utils/format'
import StatusChip from '../../components/common/StatusChip'
import Pagination from '../../components/common/Pagination'
import { useLang } from '../../i18n/useLang'
import { useAuth } from '../../context/useAuth'

const CENTRES = ['ALL', 'Jaipur Main', 'Jaipur South', 'Kota', 'Sikar']

const CENTRE_BATCH_MAP = {
  'Jaipur Main': [
    'JEE 2027 Morning',
    'JEE 2027 Evening',
    'NEET 2027 Morning',
    'NEET 2027 Evening',
    'JEE 2028',
    'NEET 2028',
  ],
  'Jaipur South': ['JEE 2027 Morning', 'NEET 2027 Morning', 'JEE 2028'],
  'Kota': ['JEE 2027 Morning', 'JEE 2027 Evening', 'NEET 2027 Morning', 'NEET 2027 Evening'],
  'Sikar': ['JEE 2027 Morning', 'NEET 2027 Morning'],
}

const ALL_BATCHES = [
  'JEE 2027 Morning',
  'JEE 2027 Evening',
  'NEET 2027 Morning',
  'NEET 2027 Evening',
  'JEE 2028',
  'NEET 2028',
]

const AGEING_BUCKETS = [
  { key: 'current', label: 'Current', minDays: null, desc: 'Not due yet' },
  { key: '1_30', label: '1–30 d', minDays: '1', desc: '1 to 30 days overdue' },
  { key: '31_60', label: '31–60 d', minDays: '31', desc: '31 to 60 days overdue' },
  { key: '61_90', label: '61–90 d', minDays: '61', desc: '61 to 90 days overdue' },
  { key: '90_plus', label: '90+ d', minDays: '90', desc: '90+ days late' },
]

export default function DashboardView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const navigate = useNavigate()
  const { showToast } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedCentre = searchParams.get('centre') || 'ALL'
  const selectedBatch = searchParams.get('batch') || 'ALL'
  const selectedMinDays = searchParams.get('minDays') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  // Tally Export Dialog State
  const [showTallyModal, setShowTallyModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Default dates: 1st of current month to today
  const defaultDates = useMemo(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10)
    const today = now.toISOString().slice(0, 10)
    return { from: firstDay, to: today }
  }, [])

  const [tallyDates, setTallyDates] = useState(defaultDates)

  // Sort states for By Centre table
  const [centreSort, setCentreSort] = useState({ col: 'billedPaise', asc: false })
  // Sort states for By Batch table
  const [batchSort, setBatchSort] = useState({ col: 'billedPaise', asc: false })

  // Summary KPI API
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useApi(
    () => staffApi.getDashboardSummary({ centre: selectedCentre, batch: selectedBatch }),
    [selectedCentre, selectedBatch]
  )

  // By Centre breakdown API
  const {
    data: byCentreData,
    isLoading: byCentreLoading,
  } = useApi(staffApi.getDashboardByCentre, [])

  // By Batch breakdown API
  const {
    data: byBatchData,
    isLoading: byBatchLoading,
  } = useApi(staffApi.getDashboardByBatch, [])

  // Overdue List API (20 items per page)
  const {
    data: overdueData,
    isLoading: overdueLoading,
    refetch: refetchOverdue,
  } = useApi(
    () =>
      staffApi.getOverdueList({
        minDays: selectedMinDays ? parseInt(selectedMinDays, 10) : undefined,
        centre: selectedCentre,
        batch: selectedBatch,
        page,
        limit: 20,
      }),
    [selectedCentre, selectedBatch, selectedMinDays, page]
  )

  // Dynamic batch options based on selected centre
  const availableBatches = useMemo(() => {
    if (selectedCentre === 'ALL' || !CENTRE_BATCH_MAP[selectedCentre]) {
      return ['ALL', ...ALL_BATCHES]
    }
    return ['ALL', ...CENTRE_BATCH_MAP[selectedCentre]]
  }, [selectedCentre])

  // Filter handlers
  const handleFilterChange = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val && val !== 'ALL') {
      next.set(key, val)
    } else {
      next.delete(key)
    }
    // If centre changes, reset batch if current batch is not available in that centre
    if (key === 'centre') {
      const currentBatch = next.get('batch')
      if (
        currentBatch &&
        val !== 'ALL' &&
        CENTRE_BATCH_MAP[val] &&
        !CENTRE_BATCH_MAP[val].includes(currentBatch)
      ) {
        next.delete('batch')
      }
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  // Ageing bar toggle
  const handleAgeingClick = (minDays) => {
    const next = new URLSearchParams(searchParams)
    if (!minDays) {
      next.delete('minDays')
    } else if (selectedMinDays === minDays) {
      next.delete('minDays')
    } else {
      next.set('minDays', minDays)
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  // Download Tally CSV
  const handleDownloadTally = async () => {
    setIsExporting(true)
    try {
      const res = await staffApi.downloadTallyCsv(tallyDates)
      showToast(
        isHindi
          ? `Tally CSV निर्यात संपन्न (${res.receiptCount} रसीदें)`
          : `Tally export downloaded (${res.receiptCount} receipts)`,
        'success'
      )
      setShowTallyModal(false)
    } catch (err) {
      showToast(
        err.message || (isHindi ? 'निर्यात विफल रहा' : 'Failed to export Tally CSV'),
        'error'
      )
    } finally {
      setIsExporting(false)
    }
  }

  // Derived Summary Values
  const summary = useMemo(() => {
    return (
      summaryData || {
        totalBilledPaise: 0,
        totalCollectedPaise: 0,
        totalOutstandingPaise: 0,
        totalOverduePaise: 0,
        overdueStudentCount: 0,
        collectionPercent: 0,
        overduePercent: 0,
        ageing: {
          current: 0,
          '1_30': 0,
          '31_60': 0,
          '61_90': 0,
          '90_plus': 0,
        },
      }
    )
  }, [summaryData])

  // Screen-reader & text summary for 60+ days late
  const late60Summary = useMemo(() => {
    const p61_90 = summary.ageing?.['61_90'] || 0
    const p90_plus = summary.ageing?.['90_plus'] || 0
    const totalLate60 = p61_90 + p90_plus
    const pct =
      summary.totalOutstandingPaise > 0
        ? Math.round((totalLate60 / summary.totalOutstandingPaise) * 100)
        : 0
    return {
      amountPaise: totalLate60,
      percent: pct,
      text: `${formatPaise(totalLate60)} is more than 60 days late, ${pct}% of outstanding.`,
    }
  }, [summary.ageing, summary.totalOutstandingPaise])

  // Ageing Max Scale
  const maxAgeingPaise = useMemo(() => {
    const vals = AGEING_BUCKETS.map((b) => summary.ageing?.[b.key] || 0)
    return Math.max(...vals, 1)
  }, [summary.ageing])

  // Sorted By-Centre Data
  const sortedCentres = useMemo(() => {
    if (!byCentreData || !Array.isArray(byCentreData)) return []
    return [...byCentreData].sort((a, b) => {
      const va = a[centreSort.col] ?? 0
      const vb = b[centreSort.col] ?? 0
      if (typeof va === 'string') {
        return centreSort.asc ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return centreSort.asc ? va - vb : vb - va
    })
  }, [byCentreData, centreSort])

  // Sorted By-Batch Data
  const sortedBatches = useMemo(() => {
    if (!byBatchData || !Array.isArray(byBatchData)) return []
    return [...byBatchData].sort((a, b) => {
      const va = a[batchSort.col] ?? 0
      const vb = b[batchSort.col] ?? 0
      if (typeof va === 'string') {
        return batchSort.asc ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return batchSort.asc ? va - vb : vb - va
    })
  }, [byBatchData, batchSort])

  const hasActiveFilters =
    selectedCentre !== 'ALL' || selectedBatch !== 'ALL' || selectedMinDays !== ''

  // Selected Ageing label for chip
  const activeAgeingBucket = AGEING_BUCKETS.find((b) => b.minDays === selectedMinDays)

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          PAGE HEADER & GLOBAL CONTROLS
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
              {isHindi ? 'अकाउंट्स डैशबोर्ड' : 'Accounts Dashboard'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F4EC] text-[#1F7A4D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A4D] animate-pulse" />
              <span>{isHindi ? 'लाइव सिंक' : 'Live sync'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1">
            {isHindi
              ? 'सभी 4 केंद्रों और बैचों में शुल्क वसूली, बकाया राशि और रीयल-टाइम एजिंग विश्लेषण'
              : 'Institutional revenue tracking, collection performance & real-time fee ageing across all centres'}
          </p>
        </div>

        {/* Header Actions: Refresh & Export Tally */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs"
            onClick={() => {
              refetchSummary()
              refetchOverdue()
            }}
            title={isHindi ? 'डेटा रीफ्रेश करें' : 'Refresh live metrics'}
          >
            <RefreshCw
              size={14}
              className={summaryLoading || overdueLoading ? 'animate-spin text-[#0E4D44]' : ''}
            />
            <span>{isHindi ? 'रीफ्रेश' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors shadow-xs"
            onClick={() => setShowTallyModal(true)}
          >
            <Download size={14} />
            <span>{isHindi ? 'टैली एक्सपोर्ट (CSV)' : 'Export to Tally'}</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          1. FILTERS (Centre & Dynamic Batch) + CLEAR FILTERS
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Centre Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-centre" className="text-xs font-semibold text-[#7A8582]">
                {isHindi ? 'केंद्र:' : 'Centre:'}
              </label>
              <select
                id="filter-centre"
                value={selectedCentre}
                onChange={(e) => handleFilterChange('centre', e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
              >
                {CENTRES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? (isHindi ? 'सभी केंद्र (All Centres)' : 'All centres') : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Filter (depends on selected centre) */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-batch" className="text-xs font-semibold text-[#7A8582]">
                {isHindi ? 'बैच:' : 'Batch:'}
              </label>
              <select
                id="filter-batch"
                value={selectedBatch}
                onChange={(e) => handleFilterChange('batch', e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
              >
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    {b === 'ALL' ? (isHindi ? 'सभी बैच (All Batches)' : 'All batches') : b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Chips & Clear */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {activeAgeingBucket && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FFF4E0] text-[#9A5B0B] border border-[#D98A1E]/30">
                  <span>
                    {isHindi
                      ? `एजिंग: ${activeAgeingBucket.label}`
                      : `Ageing: ${activeAgeingBucket.desc}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAgeingClick(null)}
                    className="hover:text-[#B3261E] focus:outline-none"
                    aria-label="Clear ageing filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E7E3DA] bg-white hover:bg-[#FDECEA] hover:border-[#B3261E] hover:text-[#B3261E] text-xs font-semibold text-[#4A5654] transition-colors"
              >
                <X size={12} />
                <span>{isHindi ? 'फ़िल्टर हटाएं' : 'Clear filters'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. FOUR KPI TILES (Billed, Collected, Outstanding, Overdue)
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Billed */}
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-[#7A8582] uppercase tracking-wider">
            {isHindi ? 'कुल बिल किया गया' : 'Total Billed'}
          </div>
          <div className="mt-2">
            {summaryLoading ? (
              <div className="h-9 w-28 bg-[#FAF8F4] animate-pulse rounded-lg" />
            ) : (
              <div
                className="font-serif font-bold text-3xl sm:text-4xl text-[#14211F] tabular-nums"
                title={formatPaise(summary.totalBilledPaise)}
              >
                {formatPaiseCompact(summary.totalBilledPaise)}
              </div>
            )}
          </div>
          <div className="text-xs text-[#7A8582] mt-3">
            {isHindi ? 'सत्र 2026-27 के कुल चालान' : 'All enrolled fee schedules'}
          </div>
        </div>

        {/* KPI 2: Collected */}
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7A8582] uppercase tracking-wider">
              {isHindi ? 'वसूली (Collected)' : 'Collected'}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F4EC] text-[#1F7A4D]">
              {formatPercent(summary.collectionPercent)}
            </span>
          </div>
          <div className="mt-2">
            {summaryLoading ? (
              <div className="h-9 w-28 bg-[#FAF8F4] animate-pulse rounded-lg" />
            ) : (
              <div
                className="font-serif font-bold text-3xl sm:text-4xl text-[#1F7A4D] tabular-nums"
                title={formatPaise(summary.totalCollectedPaise)}
              >
                {formatPaiseCompact(summary.totalCollectedPaise)}
              </div>
            )}
          </div>
          <div className="text-xs text-[#7A8582] mt-3">
            {isHindi
              ? `${formatPercent(summary.collectionPercent)} शुल्क प्राप्त हुआ`
              : `${formatPercent(summary.collectionPercent)} of total billed`}
          </div>
        </div>

        {/* KPI 3: Outstanding */}
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-[#7A8582] uppercase tracking-wider">
            {isHindi ? 'कुल शेष (Outstanding)' : 'Outstanding'}
          </div>
          <div className="mt-2">
            {summaryLoading ? (
              <div className="h-9 w-28 bg-[#FAF8F4] animate-pulse rounded-lg" />
            ) : (
              <div
                className="font-serif font-bold text-3xl sm:text-4xl text-[#14211F] tabular-nums"
                title={formatPaise(summary.totalOutstandingPaise)}
              >
                {formatPaiseCompact(summary.totalOutstandingPaise)}
              </div>
            )}
          </div>
          <div className="text-xs text-[#7A8582] mt-3">
            {isHindi ? 'आगामी व अतिदेय किस्तों का योग' : 'Current balance + overdue'}
          </div>
        </div>

        {/* KPI 4: Overdue */}
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#B3261E] uppercase tracking-wider">
              {isHindi ? 'अतिदेय (Overdue)' : 'Overdue'}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#B3261E]">
              {formatPercent(summary.overduePercent)}
            </span>
          </div>
          <div className="mt-2">
            {summaryLoading ? (
              <div className="h-9 w-28 bg-[#FAF8F4] animate-pulse rounded-lg" />
            ) : (
              <div
                className="font-serif font-bold text-3xl sm:text-4xl text-[#B3261E] tabular-nums"
                title={formatPaise(summary.totalOverduePaise)}
              >
                {formatPaiseCompact(summary.totalOverduePaise)}
              </div>
            )}
          </div>
          <div className="text-xs text-[#7A8582] mt-3">
            {isHindi
              ? `${summary.overdueStudentCount || 0} विद्यार्थियों की किस्तें overdue`
              : `${summary.overdueStudentCount || 0} students with overdue dues`}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          3. AGEING CHART (SVG Bars + Click to Filter + SR Sentence)
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#14211F]">
              {isHindi ? 'शुल्क एजिंग विश्लेषण (Fee Ageing Buckets)' : 'Fee Ageing Analysis'}
            </h2>
            <p className="text-xs text-[#4A5654] mt-0.5">
              {isHindi
                ? 'किस्त देय तिथि के आधार पर बकाया वर्गीकरण। किसी भी बार पर क्लिक कर फ़िल्टर करें:'
                : 'Click any bucket to filter overdue students below. Based on elapsed days past due date:'}
            </p>
          </div>

          {/* Screen-reader and visible summary caption */}
          <div
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#FFF4E0] text-[#9A5B0B] border border-[#D98A1E]/30"
            role="status"
            aria-live="polite"
          >
            {late60Summary.text}
          </div>
        </div>

        {/* Inline SVG Chart */}
        <div className="pt-2">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end h-44 border-b border-[#E7E3DA] pb-2">
            {AGEING_BUCKETS.map((b) => {
              const amountPaise = summary.ageing?.[b.key] || 0
              const heightPct = Math.max(8, Math.round((amountPaise / maxAgeingPaise) * 100))
              const isSelected = selectedMinDays === b.minDays && b.minDays !== null
              const isCurrent = b.key === 'current'

              const barColor = isCurrent
                ? isSelected
                  ? 'bg-[#0E4D44]'
                  : 'bg-[#E6F0EE] hover:bg-[#0E4D44]/20'
                : isSelected
                ? 'bg-[#B3261E]'
                : b.key === '1_30'
                ? 'bg-[#FFF4E0] hover:bg-[#D98A1E]/30'
                : 'bg-[#FDECEA] hover:bg-[#B3261E]/30'

              const textColor = isCurrent ? 'text-[#0E4D44]' : 'text-[#B3261E]'

              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => handleAgeingClick(b.minDays)}
                  aria-pressed={isSelected}
                  title={`${b.desc}: ${formatPaise(amountPaise)}`}
                  className={`group relative flex flex-col items-center justify-end h-full w-full rounded-xl transition-all p-1 focus:outline-none focus:ring-2 focus:ring-[#0E4D44] ${
                    isSelected ? 'ring-2 ring-[#0E4D44] bg-[#FAF8F4]' : ''
                  }`}
                >
                  {/* Amount label above bar */}
                  <span
                    className={`text-[11px] sm:text-xs font-bold tabular-nums mb-1 transition-colors ${
                      isSelected ? 'text-[#14211F]' : textColor
                    }`}
                  >
                    {formatPaiseCompact(amountPaise)}
                  </span>

                  {/* Visual Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[48px] rounded-t-lg transition-all border ${
                      isSelected
                        ? 'border-[#0E4D44] shadow-xs'
                        : 'border-[#E7E3DA]'
                    } ${barColor}`}
                  />
                </button>
              )
            })}
          </div>

          {/* Bucket Name Labels */}
          <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-2 text-center">
            {AGEING_BUCKETS.map((b) => {
              const isSelected = selectedMinDays === b.minDays && b.minDays !== null
              return (
                <div key={b.key} className="text-center">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isSelected ? 'text-[#0E4D44] font-bold' : 'text-[#14211F]'
                    }`}
                  >
                    {b.label}
                  </div>
                  <div className="text-[10px] text-[#7A8582] truncate hidden sm:block">
                    {b.desc}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          4. "BY CENTRE" AND "BY BATCH" TABLES
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table A: By Centre */}
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-[#14211F]">
                {isHindi ? 'केंद्र अनुसार प्रदर्शन' : 'Performance by Centre'}
              </h2>
              <p className="text-[11px] text-[#7A8582]">
                {isHindi ? 'क्लिक कर उस केंद्र का फ़िल्टर लगाएं' : 'Click any row to filter by centre'}
              </p>
            </div>
            <Building2 size={16} className="text-[#0E4D44]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Collections by Centre">
              <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
                <tr>
                  <th
                    scope="col"
                    className="pb-2.5 cursor-pointer hover:text-[#14211F]"
                    onClick={() =>
                      setCentreSort((p) => ({ col: 'centre', asc: p.col === 'centre' ? !p.asc : true }))
                    }
                    aria-sort={centreSort.col === 'centre' ? (centreSort.asc ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      <span>{isHindi ? 'केंद्र' : 'Centre'}</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th scope="col" className="pb-2.5 text-right">
                    {isHindi ? 'बिल राशि' : 'Billed'}
                  </th>
                  <th scope="col" className="pb-2.5 text-right">
                    {isHindi ? 'प्राप्त' : 'Collected'}
                  </th>
                  <th scope="col" className="pb-2.5 text-right">
                    {isHindi ? 'अतिदेय' : 'Overdue'}
                  </th>
                  <th scope="col" className="pb-2.5 text-right pl-3">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]/60">
                {byCentreLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#7A8582]">
                      <RefreshCw size={14} className="animate-spin inline-block mr-2" />
                      Loading centres...
                    </td>
                  </tr>
                ) : sortedCentres.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[#7A8582]">
                      No centres recorded
                    </td>
                  </tr>
                ) : (
                  sortedCentres.map((c) => {
                    const isSelected = selectedCentre === c.centre
                    return (
                      <tr
                        key={c.centre}
                        onClick={() => handleFilterChange('centre', c.centre)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#E6F0EE] font-semibold text-[#0E4D44]'
                            : 'hover:bg-[#FAF8F4]'
                        }`}
                      >
                        <td className="py-2.5 font-medium text-[#14211F]">{c.centre}</td>
                        <td className="py-2.5 text-right tabular-nums text-[#4A5654]">
                          {formatPaiseCompact(c.billedPaise)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[#1F7A4D] font-medium">
                          {formatPaiseCompact(c.collectedPaise)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[#B3261E] font-medium">
                          {formatPaiseCompact(c.overduePaise)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums pl-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-semibold text-[11px]">{c.collectionPercent}%</span>
                            <div className="w-10 h-1.5 rounded-full bg-[#E7E3DA] overflow-hidden">
                              <div
                                className="h-full bg-[#0E4D44] rounded-full"
                                style={{ width: `${Math.min(100, c.collectionPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table B: By Batch */}
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-[#14211F]">
                {isHindi ? 'बैच अनुसार प्रदर्शन' : 'Performance by Batch'}
              </h2>
              <p className="text-[11px] text-[#7A8582]">
                {isHindi ? 'क्लिक कर उस बैच का फ़िल्टर लगाएं' : 'Click any row to filter by batch'}
              </p>
            </div>
            <GraduationCap size={16} className="text-[#0E4D44]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Collections by Batch">
              <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
                <tr>
                  <th
                    scope="col"
                    className="pb-2.5 cursor-pointer hover:text-[#14211F]"
                    onClick={() =>
                      setBatchSort((p) => ({ col: 'batch', asc: p.col === 'batch' ? !p.asc : true }))
                    }
                    aria-sort={batchSort.col === 'batch' ? (batchSort.asc ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      <span>{isHindi ? 'बैच' : 'Batch'}</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th scope="col" className="pb-2.5 text-right">
                    {isHindi ? 'बिल राशि' : 'Billed'}
                  </th>
                  <th scope="col" className="pb-2.5 text-right">
                    {isHindi ? 'प्राप्त' : 'Collected'}
                  </th>
                  <th scope="col" className="pb-2.5 text-right">
                    {isHindi ? 'अतिदेय' : 'Overdue'}
                  </th>
                  <th scope="col" className="pb-2.5 text-right pl-3">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]/60">
                {byBatchLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#7A8582]">
                      <RefreshCw size={14} className="animate-spin inline-block mr-2" />
                      Loading batches...
                    </td>
                  </tr>
                ) : sortedBatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-[#7A8582]">
                      No batches recorded
                    </td>
                  </tr>
                ) : (
                  sortedBatches.map((b) => {
                    const isSelected = selectedBatch === b.batch
                    return (
                      <tr
                        key={b.batch}
                        onClick={() => handleFilterChange('batch', b.batch)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#E6F0EE] font-semibold text-[#0E4D44]'
                            : 'hover:bg-[#FAF8F4]'
                        }`}
                      >
                        <td className="py-2.5 font-medium text-[#14211F]">{b.batch}</td>
                        <td className="py-2.5 text-right tabular-nums text-[#4A5654]">
                          {formatPaiseCompact(b.billedPaise)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[#1F7A4D] font-medium">
                          {formatPaiseCompact(b.collectedPaise)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[#B3261E] font-medium">
                          {formatPaiseCompact(b.overduePaise)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums pl-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-semibold text-[11px]">{b.collectionPercent}%</span>
                            <div className="w-10 h-1.5 rounded-full bg-[#E7E3DA] overflow-hidden">
                              <div
                                className="h-full bg-[#0E4D44] rounded-full"
                                style={{ width: `${Math.min(100, b.collectionPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          5. OVERDUE LIST (20 per page, click row to open student ledger)
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg text-[#14211F]">
                {isHindi ? 'अतिदेय शुल्क सूची' : 'Overdue Dues List'}
              </h2>
              {overdueData?.meta?.total !== undefined && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#B3261E]">
                  {overdueData.meta.total} {isHindi ? 'किस्तें' : 'instalments'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#7A8582] mt-0.5">
              {isHindi
                ? 'छात्र के लेजर और भुगतान विवरण देखने के लिए किसी भी पंक्ति पर क्लिक करें'
                : 'Click any row to open the complete student ledger and record payment'}
            </p>
          </div>

          {selectedMinDays && (
            <div className="text-xs font-medium text-[#7A8582]">
              Showing filter: <span className="font-semibold text-[#14211F]">{activeAgeingBucket?.desc}</span>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label="Overdue Students">
            <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
              <tr>
                <th scope="col" className="pb-3">
                  {isHindi ? 'विद्यार्थी (Student)' : 'Student'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'केंद्र व बैच' : 'Centre & Batch'}
                </th>
                <th scope="col" className="pb-3 text-right">
                  {isHindi ? 'बकाया राशि' : 'Balance'}
                </th>
                <th scope="col" className="pb-3 text-center">
                  {isHindi ? 'अतिदेय दिन' : 'Days Overdue'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'अंतिम रिमाइंडर' : 'Last Reminder'}
                </th>
                <th scope="col" className="pb-3 text-right">
                  {isHindi ? 'जोखिम स्तर' : 'Risk Level'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DA]/60">
              {overdueLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7A8582]">
                    <RefreshCw size={16} className="animate-spin inline-block mr-2 text-[#0E4D44]" />
                    <span>Loading overdue records...</span>
                  </td>
                </tr>
              ) : !overdueData?.data || overdueData.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center font-bold">
                        <Check size={20} />
                      </div>
                      <div className="font-serif font-bold text-base text-[#14211F]">
                        {isHindi ? 'कोई अतिदेय शुल्क नहीं। बहुत अच्छा।' : 'No overdue fees. Well done.'}
                      </div>
                      <div className="text-xs text-[#7A8582]">
                        {isHindi
                          ? 'वर्तमान फ़िल्टर के अंतर्गत सभी किस्तें समय पर चुकता हैं।'
                          : 'All fee instalments in this scope are fully settled.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                overdueData.data.map((item) => {
                  const riskLevel = item.riskLevel || 'low'
                  return (
                    <tr
                      key={item.instalmentId}
                      onClick={() => navigate(`/accounts/students/${encodeURIComponent(item.studentId)}`)}
                      className="cursor-pointer hover:bg-[#FAF8F4] transition-colors group"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(`/accounts/students/${encodeURIComponent(item.studentId)}`)
                      }}
                      role="link"
                      aria-label={`Open ledger for ${item.studentName}`}
                    >
                      {/* Student info */}
                      <td className="py-3.5 pr-2">
                        <div className="font-semibold text-sm text-[#14211F] group-hover:text-[#0E4D44] transition-colors">
                          {item.studentName}
                        </div>
                        <div className="text-[11px] font-mono text-[#7A8582]">{item.studentId}</div>
                      </td>

                      {/* Centre & Batch */}
                      <td className="py-3.5 pr-2 text-[#4A5654]">
                        <div className="font-medium text-[#14211F]">{item.centre}</div>
                        <div className="text-[11px] text-[#7A8582]">{item.batch}</div>
                      </td>

                      {/* Balance Amount */}
                      <td className="py-3.5 pr-2 text-right font-serif font-bold text-sm text-[#B3261E] tabular-nums">
                        {formatPaise(item.balancePaise)}
                      </td>

                      {/* Days Overdue Chip */}
                      <td className="py-3.5 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEA] text-[#B3261E]">
                          <AlertCircle size={11} />
                          <span>{item.daysOverdue} d late</span>
                        </span>
                      </td>

                      {/* Last reminder */}
                      <td className="py-3.5 pr-2 text-[#4A5654]">
                        {item.lastReminderDate ? (
                          <div>
                            <div className="font-medium text-[#14211F]">
                              {formatDate(item.lastReminderDate, lang)}
                            </div>
                            <div className="text-[10px] text-[#7A8582] uppercase tracking-wider">
                              {item.lastReminderStatus || 'Sent'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#7A8582]">—</span>
                        )}
                      </td>

                      {/* Risk Level Chip */}
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            riskLevel === 'high'
                              ? 'bg-[#FDECEA] text-[#B3261E]'
                              : riskLevel === 'medium'
                              ? 'bg-[#FFF4E0] text-[#9A5B0B]'
                              : 'bg-[#E8F4EC] text-[#1F7A4D]'
                          }`}
                        >
                          {riskLevel === 'high' && <ShieldAlert size={11} />}
                          <span>{riskLevel}</span>
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (20 per page) */}
        {overdueData?.meta && overdueData.meta.totalPages > 1 && (
          <div className="pt-2 border-t border-[#E7E3DA]">
            <Pagination
              currentPage={page}
              totalPages={overdueData.meta.totalPages}
              totalResults={overdueData.meta.total}
              onPageChange={(p) => {
                const next = new URLSearchParams(searchParams)
                next.set('page', String(p))
                setSearchParams(next)
              }}
            />
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          6. EXPORT TO TALLY DIALOG MODAL
         ────────────────────────────────────────────────────────── */}
      {showTallyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs transition-opacity"
            onClick={() => !isExporting && setShowTallyModal(false)}
            aria-hidden="true"
          />

          {/* Dialog Card */}
          <div
            className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-xl space-y-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tally-dialog-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center font-bold text-xs">
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <h3 id="tally-dialog-title" className="font-serif font-bold text-lg text-[#14211F]">
                    {isHindi ? 'टैली एक्सपोर्ट (CSV)' : 'Export Receipts for Tally'}
                  </h3>
                  <div className="text-[11px] text-[#7A8582]">GST-compliant ledger format</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isExporting && setShowTallyModal(false)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F] hover:bg-[#FAF8F4]"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Date Range Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tally-from" className="block text-xs font-semibold text-[#4A5654] mb-1">
                    {isHindi ? 'आरंभ तिथि (From)' : 'From date'}
                  </label>
                  <input
                    type="date"
                    id="tally-from"
                    value={tallyDates.from}
                    onChange={(e) => setTallyDates((p) => ({ ...p, from: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                  />
                </div>
                <div>
                  <label htmlFor="tally-to" className="block text-xs font-semibold text-[#4A5654] mb-1">
                    {isHindi ? 'अंतिम तिथि (To)' : 'To date'}
                  </label>
                  <input
                    type="date"
                    id="tally-to"
                    value={tallyDates.to}
                    onChange={(e) => setTallyDates((p) => ({ ...p, to: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                  />
                </div>
              </div>

              {/* Preview Line */}
              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-xs text-[#4A5654]">
                <span className="font-semibold text-[#14211F]">Export scope: </span>
                {tallyDates.from} to {tallyDates.to}
              </div>

              {/* Tally Columns Assumption Help Note */}
              <div className="text-[11px] text-[#7A8582] leading-relaxed">
                <span className="font-semibold text-[#4A5654]">Columns included: </span>
                Date, Voucher No, Student ID & Name, Centre, Batch, Coaching Tuition Fees Ledger, Amount, Payment Mode, Gateway Ref, GST Amount.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E3DA]">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setShowTallyModal(false)}
                className="h-10 px-4 rounded-xl border border-[#E7E3DA] bg-white hover:bg-[#FAF8F4] text-xs font-semibold text-[#4A5654] transition-colors"
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadTally}
                className="h-10 px-5 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>{isHindi ? 'डाउनलोड हो रहा है...' : 'Generating CSV...'}</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>{isHindi ? 'CSV डाउनलोड करें' : 'Download CSV'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
