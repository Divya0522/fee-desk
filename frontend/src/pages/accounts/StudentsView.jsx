import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  X,
  ArrowUpDown,
  Building2,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useDebounce } from '../../hooks/useDebounce'
import * as staffApi from '../../services/staffApi'
import { formatPaise, formatDaysOverdue } from '../../utils/format'
import StatusChip from '../../components/common/StatusChip'
import Pagination from '../../components/common/Pagination'
import { useLang } from '../../i18n/useLang'

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

export default function StudentsView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchInput, 300)

  const selectedCentre = searchParams.get('centre') || 'ALL'
  const selectedBatch = searchParams.get('batch') || 'ALL'
  const selectedStatus = searchParams.get('status') || 'ALL'
  const overdueOnly = searchParams.get('overdueOnly') === 'true'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '15', 10)

  // Local column sorting state
  const [sortCol, setSortCol] = useState('studentId')
  const [sortAsc, setSortAsc] = useState(true)

  const { data, isLoading, refetch } = useApi(
    () =>
      staffApi.getStudents({
        search: debouncedSearch,
        centre: selectedCentre,
        batch: selectedBatch,
        status: selectedStatus,
        overdueOnly,
        page,
        limit,
      }),
    [debouncedSearch, selectedCentre, selectedBatch, selectedStatus, overdueOnly, page, limit]
  )

  const availableBatches = useMemo(() => {
    if (selectedCentre === 'ALL' || !CENTRE_BATCH_MAP[selectedCentre]) {
      return ['ALL', ...ALL_BATCHES]
    }
    return ['ALL', ...CENTRE_BATCH_MAP[selectedCentre]]
  }, [selectedCentre])

  const handleFilterChange = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val && val !== 'ALL') {
      next.set(key, val)
    } else {
      next.delete(key)
    }
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

  const toggleOverdueOnly = () => {
    const next = new URLSearchParams(searchParams)
    if (overdueOnly) {
      next.delete('overdueOnly')
    } else {
      next.set('overdueOnly', 'true')
    }
    next.set('page', '1')
    setSearchParams(next)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams())
  }

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortCol(col)
      setSortAsc(true)
    }
  }

  // Client-side sort on loaded page results
  const sortedStudents = useMemo(() => {
    if (!data?.students || !Array.isArray(data.students)) return []
    return [...data.students].sort((a, b) => {
      let va = a[sortCol] ?? ''
      let vb = b[sortCol] ?? ''
      if (typeof va === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortAsc ? va - vb : vb - va
    })
  }, [data?.students, sortCol, sortAsc])

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    selectedCentre !== 'ALL' ||
    selectedBatch !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    overdueOnly

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
              {isHindi ? 'विद्यार्थी निर्देशिका' : 'Students Directory'}
            </h1>
            {data?.total !== undefined && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E6F0EE] text-[#0E4D44]">
                {data.total} {isHindi ? 'विद्यार्थी' : 'students'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1">
            {isHindi
              ? 'सभी नामांकित विद्यार्थियों के शुल्क खाते, किस्तों की स्थिति व लेजर खोजें'
              : 'Search and inspect all enrolled student fee ledgers, instalment schedules and status'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#0E4D44]' : ''} />
          <span>{isHindi ? 'रीफ्रेश' : 'Refresh'}</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SEARCH & FILTER TOOLBAR
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8582]"
            />
            <input
              type="text"
              placeholder={
                isHindi
                  ? 'नाम या आईडी से खोजें (उदा. STU-0219)...'
                  : 'Search by name or ID (e.g. STU-0219)...'
              }
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                const next = new URLSearchParams(searchParams)
                if (e.target.value) {
                  next.set('search', e.target.value)
                } else {
                  next.delete('search')
                }
                next.set('page', '1')
                setSearchParams(next)
              }}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] placeholder:text-[#7A8582] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  const next = new URLSearchParams(searchParams)
                  next.delete('search')
                  setSearchParams(next)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Centre Select */}
          <select
            value={selectedCentre}
            onChange={(e) => handleFilterChange('centre', e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          >
            {CENTRES.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? (isHindi ? 'सभी केंद्र (All Centres)' : 'All centres') : c}
              </option>
            ))}
          </select>

          {/* Batch Select */}
          <select
            value={selectedBatch}
            onChange={(e) => handleFilterChange('batch', e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          >
            {availableBatches.map((b) => (
              <option key={b} value={b}>
                {b === 'ALL' ? (isHindi ? 'सभी बैच (All Batches)' : 'All batches') : b}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          >
            <option value="ALL">{isHindi ? 'सभी स्थितियाँ (All Status)' : 'All status'}</option>
            <option value="active">{isHindi ? 'सक्रिय (Active)' : 'Active'}</option>
            <option value="left">{isHindi ? 'छोड़ चुके (Left)' : 'Left'}</option>
          </select>
        </div>

        {/* Filter Pills & Overdue Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E7E3DA]/60">
          <button
            type="button"
            onClick={toggleOverdueOnly}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
              overdueOnly
                ? 'bg-[#B3261E] text-white shadow-xs'
                : 'border border-[#E7E3DA] bg-[#FAF8F4] text-[#4A5654] hover:border-[#B3261E] hover:text-[#B3261E]'
            }`}
          >
            <AlertTriangle size={12} />
            <span>{isHindi ? 'केवल अतिदेय (Overdue only)' : 'Overdue only'}</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A8582] hover:text-[#B3261E] transition-colors"
            >
              <X size={12} />
              <span>{isHindi ? 'सभी फ़िल्टर साफ़ करें' : 'Clear all filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          STUDENTS TABLE
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label="Students Directory">
            <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
              <tr>
                <th
                  scope="col"
                  className="pb-3 cursor-pointer hover:text-[#14211F]"
                  onClick={() => handleSort('studentId')}
                  aria-sort={sortCol === 'studentId' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    <span>{isHindi ? 'आईडी' : 'Student ID'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th
                  scope="col"
                  className="pb-3 cursor-pointer hover:text-[#14211F]"
                  onClick={() => handleSort('name')}
                  aria-sort={sortCol === 'name' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    <span>{isHindi ? 'विद्यार्थी नाम' : 'Name'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'केंद्र' : 'Centre'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'बैच' : 'Batch'}
                </th>
                <th
                  scope="col"
                  className="pb-3 text-right cursor-pointer hover:text-[#14211F]"
                  onClick={() => handleSort('balancePaise')}
                  aria-sort={sortCol === 'balancePaise' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isHindi ? 'बकाया' : 'Balance'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th
                  scope="col"
                  className="pb-3 text-center cursor-pointer hover:text-[#14211F]"
                  onClick={() => handleSort('daysOverdue')}
                  aria-sort={sortCol === 'daysOverdue' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{isHindi ? 'अतिदेय दिन' : 'Overdue Status'}</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th scope="col" className="pb-3 text-center">
                  {isHindi ? 'जोखिम' : 'Risk'}
                </th>
                <th scope="col" className="pb-3 text-right">
                  {isHindi ? 'स्थिति' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DA]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#7A8582]">
                    <RefreshCw size={16} className="animate-spin inline-block mr-2 text-[#0E4D44]" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              ) : sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-[#7A8582] flex items-center justify-center font-bold">
                        <UserCheck size={20} />
                      </div>
                      <div className="font-serif font-bold text-base text-[#14211F]">
                        {isHindi ? 'कोई विद्यार्थी नहीं मिला' : 'No students found'}
                      </div>
                      <div className="text-xs text-[#7A8582]">
                        {isHindi
                          ? 'कृपया अपना खोज शब्द या फ़िल्टर बदलकर पुनः प्रयास करें।'
                          : 'Try adjusting your search criteria or clearing selected filters.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student) => {
                  const isOverdue = student.daysOverdue > 0
                  const isLeft = student.status === 'left'

                  return (
                    <tr
                      key={student.studentId}
                      onClick={() => navigate(`/accounts/students/${encodeURIComponent(student.studentId)}`)}
                      className="cursor-pointer hover:bg-[#FAF8F4] transition-colors group"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          navigate(`/accounts/students/${encodeURIComponent(student.studentId)}`)
                      }}
                      role="link"
                      aria-label={`Open ledger for ${student.name}`}
                    >
                      {/* Student ID */}
                      <td className="py-3.5 pr-2 font-mono font-bold text-xs text-[#0E4D44]">
                        {student.studentId}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 pr-2">
                        <div className="font-semibold text-sm text-[#14211F] group-hover:text-[#0E4D44] transition-colors">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-[#7A8582]">{student.course}</div>
                      </td>

                      {/* Centre */}
                      <td className="py-3.5 pr-2 text-[#4A5654] font-medium">{student.centre}</td>

                      {/* Batch */}
                      <td className="py-3.5 pr-2 text-[#4A5654]">{student.batch}</td>

                      {/* Balance */}
                      <td className="py-3.5 pr-2 text-right font-serif font-bold text-sm tabular-nums text-[#14211F]">
                        {formatPaise(student.balancePaise)}
                      </td>

                      {/* Days Overdue */}
                      <td className="py-3.5 px-2 text-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEA] text-[#B3261E]">
                            <AlertCircle size={11} />
                            <span>{student.daysOverdue} d late</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F4EC] text-[#1F7A4D]">
                            <CheckCircle2 size={11} />
                            <span>{isHindi ? 'समय पर' : 'On track'}</span>
                          </span>
                        )}
                      </td>

                      {/* Risk */}
                      <td className="py-3.5 px-2 text-center">
                        {student.riskLevel ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              student.riskLevel === 'high'
                                ? 'bg-[#FDECEA] text-[#B3261E]'
                                : student.riskLevel === 'medium'
                                ? 'bg-[#FFF4E0] text-[#9A5B0B]'
                                : 'bg-[#E8F4EC] text-[#1F7A4D]'
                            }`}
                          >
                            {student.riskLevel}
                          </span>
                        ) : (
                          <span className="text-[#7A8582]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLeft
                              ? 'bg-[#FAF8F4] border border-[#E7E3DA] text-[#7A8582]'
                              : 'bg-[#E8F4EC] text-[#1F7A4D]'
                          }`}
                        >
                          {isLeft ? (isHindi ? 'छोड़ चुके' : 'Left') : isHindi ? 'सक्रिय' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="pt-2 border-t border-[#E7E3DA]">
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              totalResults={data.total}
              onPageChange={(p) => {
                const next = new URLSearchParams(searchParams)
                next.set('page', String(p))
                setSearchParams(next)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
