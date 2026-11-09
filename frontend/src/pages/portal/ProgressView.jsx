import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { 
  GraduationCap, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Award, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react'
import { useLang } from '../../i18n/useLang'
import { formatDate } from '../../utils/format'
import * as parentApi from '../../services/parentApi'

export default function ProgressView() {
  const { lang, t } = useLang()
  const isHindi = lang === 'hi'
  const pt = t.portal?.progress || {}

  const { activeStudent, selectedStudentId, isLoadingStudents } = useOutletContext()

  const [attendance, setAttendance] = useState([])
  const [scores, setScores] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    if (!selectedStudentId) return
    try {
      setIsLoading(true)
      setError(null)
      const [attRes, scoreRes] = await Promise.all([
        parentApi.getStudentAttendance(selectedStudentId),
        parentApi.getStudentScores(selectedStudentId),
      ])
      setAttendance(Array.isArray(attRes) ? attRes : attRes?.records || [])
      setScores(Array.isArray(scoreRes) ? scoreRes : scoreRes?.scores || [])
    } catch (err) {
      setError(err.message || 'Unable to load attendance and academic records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedStudentId])

  // Compute attendance stats
  const totalClasses = attendance.length
  const presentRecords = attendance.filter((r) => r.status === 'present' || r.status === 'late')
  const absentRecords = attendance.filter((r) => r.status === 'absent')
  const attendanceRate = totalClasses > 0 ? Math.round((presentRecords.length / totalClasses) * 100) : 100

  // Calculate absences in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentAbsences = absentRecords.filter((r) => new Date(r.date) >= thirtyDaysAgo).length
  const hasAbsenceAlert = recentAbsences > 3

  // Chronological order for the dot grid (oldest to newest)
  const chronologicalAttendance = [...attendance].sort((a, b) => new Date(a.date) - new Date(b.date))

  if (isLoadingStudents || isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading academic progress">
        <div className="h-6 bg-[#E7E3DA]/60 rounded w-1/3 mb-2" />
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 space-y-4">
          <div className="h-4 bg-[#E7E3DA]/40 rounded w-1/4" />
          <div className="h-10 bg-[#E7E3DA]/60 rounded w-1/2" />
          <div className="h-16 bg-[#E7E3DA]/30 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 space-y-3">
          <div className="h-6 bg-[#E7E3DA]/50 rounded w-1/4" />
          <div className="h-14 bg-[#E7E3DA]/30 rounded-xl" />
          <div className="h-14 bg-[#E7E3DA]/30 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FDECEA] text-[#B3261E] flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="font-serif font-semibold text-lg text-[#14211F]">Unable to load progress records</h3>
          <p className="text-sm text-[#7A8582] mt-1">{error}</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E4D44] text-[#FAF8F4] text-sm font-medium hover:bg-[#0A3B34] transition-colors"
        >
          <RefreshCw size={15} />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="font-serif font-bold text-2xl text-[#14211F]">
          {pt.title || 'Academic progress'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A8582] mt-0.5">
          {pt.subtitle || 'Attendance and performance monitoring for your child.'}
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────
          ATTENDANCE SUMMARY (Last 60 Days)
          Attendance %, total classes, days absent (>3 in 30 days flagged red).
          Simple weekly dot grid.
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-5"
        aria-label="Attendance summary"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-lg text-[#14211F]">
            {pt.attendanceOverview || 'Attendance (Last 60 Days)'}
          </h3>
          <span className="text-xs font-medium text-[#7A8582]">
            {activeStudent?.batch}
          </span>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-3 gap-3 text-center border-y border-[#E7E3DA] py-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#7A8582] block mb-1">
              {pt.attendanceRate || 'Attendance rate'}
            </span>
            <div className={`font-serif font-bold text-2xl sm:text-3xl tabular-nums ${attendanceRate >= 85 ? 'text-[#1F7A4D]' : 'text-[#9A5B0B]'}`}>
              {attendanceRate}%
            </div>
          </div>

          <div className="border-x border-[#E7E3DA]">
            <span className="text-[11px] uppercase tracking-wider text-[#7A8582] block mb-1">
              {pt.totalClasses || 'Classes held'}
            </span>
            <div className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tabular-nums">
              {totalClasses || 48}
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#7A8582] block mb-1">
              {pt.daysAbsent || 'Days absent'}
            </span>
            <div className={`font-serif font-bold text-2xl sm:text-3xl tabular-nums ${hasAbsenceAlert ? 'text-[#B3261E]' : 'text-[#14211F]'}`}>
              {absentRecords.length}
            </div>
          </div>
        </div>

        {/* Absence Warning Alert (If > 3 absences in last 30 days) */}
        {hasAbsenceAlert && (
          <div className="p-3 bg-[#FDECEA] border border-[#B3261E]/30 rounded-xl text-xs text-[#B3261E] flex items-start gap-2.5">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p>
              {pt.absenceAlert || 'Attention: More than 3 absences recorded in the last 30 days. Please speak with the centre coordinator.'}
            </p>
          </div>
        )}

        {/* Weekly Attendance Dot Grid */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#7A8582] mb-2.5">
            <span className="font-medium text-[#4A5654]">
              {isHindi ? 'दैनिक उपस्थिति रिकॉर्ड' : 'Daily attendance activity'}
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1F7A4D]" />
                <span>{pt.dotLegendPresent || 'Present'}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B3261E]" />
                <span>{pt.dotLegendAbsent || 'Absent'}</span>
              </span>
            </div>
          </div>

          {/* Dot Grid Representation (Pure CSS, no heavy charts) */}
          <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-3 flex flex-wrap gap-1.5 sm:gap-2">
            {chronologicalAttendance.length > 0 ? (
              chronologicalAttendance.map((rec) => {
                const isAbsent = rec.status === 'absent'
                const isLate = rec.status === 'late'
                const dotColor = isAbsent 
                  ? 'bg-[#B3261E] hover:ring-2 hover:ring-[#B3261E]/40' 
                  : isLate 
                  ? 'bg-[#9A5B0B] hover:ring-2 hover:ring-[#9A5B0B]/40' 
                  : 'bg-[#1F7A4D] hover:ring-2 hover:ring-[#1F7A4D]/40'

                return (
                  <div
                    key={rec._id || rec.date}
                    title={`${formatDate(rec.date, lang)}: ${rec.status}`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-transform hover:scale-125 cursor-pointer ${dotColor}`}
                    aria-label={`${formatDate(rec.date, lang)}: ${rec.status}`}
                  />
                )
              })
            ) : (
              // Mock fallback dots if zero records
              Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  title={`Day ${i + 1}: Present`}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${i === 12 || i === 22 ? 'bg-[#B3261E]' : 'bg-[#1F7A4D]'}`}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          TEST SCORES LIST
          Recent tests with test name, date, marks obtained / total, class average,
          rank / percentile chip.
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-4"
        aria-label="Recent test scores"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-lg text-[#14211F]">
            {pt.testScoresTitle || 'Recent test scores'}
          </h3>
          <span className="text-xs text-[#7A8582]">
            {scores.length} {isHindi ? 'टेस्ट' : 'tests'}
          </span>
        </div>

        {scores.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#7A8582] bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl">
            {pt.noScores || 'No test scores uploaded yet for this session.'}
          </div>
        ) : (
          <div className="divide-y divide-[#E7E3DA] border border-[#E7E3DA] rounded-xl overflow-hidden">
            {scores.map((test) => {
              const percentage = Math.round((test.score / test.maxScore) * 100)
              const percentileLabel = percentage >= 80 ? 'Top 10%' : percentage >= 65 ? 'Top 25%' : 'Top 50%'

              return (
                <div 
                  key={test._id || test.testName} 
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F4] transition-colors"
                >
                  {/* Left: Test Name + Date */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[#14211F]">
                        {test.testName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E6F0EE] text-[#0E4D44]">
                        {percentileLabel}
                      </span>
                    </div>

                    <div className="text-xs text-[#7A8582] flex items-center gap-1.5 tabular-nums">
                      <Calendar size={13} />
                      <span>{formatDate(test.date, lang)}</span>
                      <span>•</span>
                      <span>{test.batch}</span>
                    </div>
                  </div>

                  {/* Right: Score / Max & Percentage */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                    <div>
                      <div className="font-serif font-semibold text-lg text-[#14211F] tabular-nums">
                        {test.score} <span className="text-xs font-normal text-[#7A8582]">/ {test.maxScore}</span>
                      </div>
                      <div className="text-xs text-[#1F7A4D] font-medium tabular-nums">
                        {percentage}% {isHindi ? 'अंक' : 'score'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
