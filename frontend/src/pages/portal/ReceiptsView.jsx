import { useState, useEffect } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { 
  FileText, 
  Calendar, 
  Download, 
  Eye, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react'
import { useLang } from '../../i18n/useLang'
import { formatPaise, formatDate } from '../../utils/format'
import * as parentApi from '../../services/parentApi'
import ReceiptModal from './ReceiptModal'

export default function ReceiptsView() {
  const { lang, t } = useLang()
  const isHindi = lang === 'hi'
  const pt = t.portal?.receipts || {}

  const { activeStudent, selectedStudentId, isLoadingStudents } = useOutletContext()
  const [searchParams] = useSearchParams()

  const [receipts, setReceipts] = useState([])
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchReceipts = async () => {
    if (!selectedStudentId) return
    try {
      setIsLoadingReceipts(true)
      setError(null)
      const res = await parentApi.getStudentReceipts(selectedStudentId)
      const list = Array.isArray(res) ? res : res?.receipts || []
      setReceipts(list)

      // Auto-open receipt if highlight param is present
      const highlightNo = searchParams.get('highlight')
      if (highlightNo) {
        const found = list.find((r) => r.receiptNo === highlightNo)
        if (found) {
          setSelectedReceipt(found)
          setIsModalOpen(true)
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load official receipts.')
    } finally {
      setIsLoadingReceipts(false)
    }
  }

  useEffect(() => {
    fetchReceipts()
  }, [selectedStudentId])

  const handleOpenReceipt = (receipt) => {
    setSelectedReceipt(receipt)
    setIsModalOpen(true)
  }

  // Skeleton loading state
  if (isLoadingStudents || isLoadingReceipts) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading receipts">
        <div className="h-6 bg-[#E7E3DA]/60 rounded w-1/3 mb-2" />
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 space-y-4">
          <div className="h-16 bg-[#E7E3DA]/40 rounded-xl" />
          <div className="h-16 bg-[#E7E3DA]/40 rounded-xl" />
          <div className="h-16 bg-[#E7E3DA]/40 rounded-xl" />
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
          <h3 className="font-serif font-semibold text-lg text-[#14211F]">Unable to load receipts</h3>
          <p className="text-sm text-[#7A8582] mt-1">{error}</p>
        </div>
        <button
          type="button"
          onClick={fetchReceipts}
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
      {/* Receipts Section Header */}
      <div>
        <h2 className="font-serif font-bold text-2xl text-[#14211F]">
          {pt.title || 'GST Receipts'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A8582] mt-0.5">
          {pt.subtitle || 'Official tax invoices issued by Jaipur Coaching Centre.'}
        </p>
      </div>

      {/* Receipts List */}
      {receipts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8F4] text-[#7A8582] border border-[#E7E3DA] flex items-center justify-center">
            <FileText size={22} strokeWidth={1.5} />
          </div>
          <h3 className="font-serif font-semibold text-base text-[#14211F]">
            {isHindi ? 'कोई रसीद उपलब्ध नहीं है' : 'No receipts issued yet'}
          </h3>
          <p className="text-xs text-[#7A8582] max-w-sm mx-auto">
            {pt.noReceipts || 'Receipts appear instantly upon payment with verified GST breakdown.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E7E3DA] border border-[#E7E3DA] bg-white rounded-2xl overflow-hidden shadow-sm">
          {receipts.map((receipt) => {
            const gstAmountPaise = receipt.gstPaise || Math.round(receipt.amountPaise * 0.18 / 1.18)
            const gstText = pt.gstIncluded 
              ? pt.gstIncluded.replace('{gst}', formatPaise(gstAmountPaise).replace('₹', ''))
              : `Includes ${formatPaise(gstAmountPaise)} GST at 18%`

            return (
              <div
                key={receipt._id || receipt.receiptNo}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F4] transition-colors"
              >
                {/* Left: Receipt details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#0E4D44]">
                      {receipt.receiptNo}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#E8F4EC] text-[#1F7A4D]">
                      <ShieldCheck size={12} />
                      <span>Verified GST</span>
                    </span>
                  </div>

                  <div className="text-xs text-[#7A8582] flex items-center gap-1.5 tabular-nums">
                    <Calendar size={13} />
                    <span>{pt.issuedDate || 'Issued'}: {formatDate(receipt.issuedAt, lang)}</span>
                  </div>

                  {/* Quiet GST line */}
                  <div className="text-xs text-[#7A8582]">
                    {gstText}
                  </div>
                </div>

                {/* Right: Amount & View button */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <div className="font-serif font-bold text-xl text-[#14211F] tabular-nums">
                      {formatPaise(receipt.amountPaise)}
                    </div>
                    <span className="text-[11px] text-[#1F7A4D] font-medium">
                      Paid in Full
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReceipt(receipt)}
                    className="h-10 px-4 rounded-xl bg-[#FAF8F4] hover:bg-[#0E4D44] text-[#0E4D44] hover:text-[#FAF8F4] border border-[#0E4D44]/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Eye size={14} />
                    <span>{pt.viewReceipt || 'View receipt'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Official Tax Invoice Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedReceipt(null)
          }}
          receipt={selectedReceipt}
          student={activeStudent}
        />
      )}
    </div>
  )
}
