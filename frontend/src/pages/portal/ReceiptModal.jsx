import { useRef } from 'react'
import { X, Printer, ShieldCheck, Download } from 'lucide-react'
import { formatPaise, formatDate } from '../../utils/format'
import { useLang } from '../../i18n/useLang'
import { useAuth } from '../../context/useAuth'

export default function ReceiptModal({ isOpen, onClose, receipt, student }) {
  const { lang, t } = useLang()
  const { user } = useAuth()
  const printRef = useRef(null)

  if (!isOpen || !receipt) return null

  const pt = t.portal?.receipts || {}
  const isHindi = lang === 'hi'

  const taxablePaise = receipt.taxableValuePaise || Math.round(receipt.amountPaise / 1.18)
  const totalGstPaise = receipt.gstPaise || (receipt.amountPaise - taxablePaise)
  const cgstPaise = Math.round(totalGstPaise / 2)
  const sgstPaise = totalGstPaise - cgstPaise

  const handlePrint = () => {
    window.print()
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Invoice Card Container */}
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl border border-[#E7E3DA] shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAF8F4] border-b border-[#E7E3DA] print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0E4D44]" />
            <span className="font-serif font-semibold text-sm text-[#14211F]">
              {receipt.receiptNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E4D44] text-[#FAF8F4] text-xs font-medium hover:bg-[#0A3B34] transition-colors"
            >
              <Printer size={14} />
              <span>{pt.printInvoice || 'Print / Save PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#7A8582] hover:text-[#14211F] rounded-lg hover:bg-white transition-colors"
              aria-label={pt.close || 'Close'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Tax Invoice Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-[#14211F]" id="printable-tax-invoice" ref={printRef}>
          {/* Institute Header */}
          <div className="border-b-2 border-[#14211F] pb-4 text-center space-y-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#7A8582]">
              {pt.taxInvoice || 'TAX INVOICE / FEE RECEIPT'}
            </span>
            <h2 className="font-serif font-bold text-2xl text-[#0E4D44]">
              {pt.coachingName || 'FeeDesk Coaching Institute'}
            </h2>
            <p className="text-xs text-[#4A5654] max-w-md mx-auto">
              {pt.centreAddress || 'Plot 14, Gopalpura Bypass, Tonk Road, Jaipur, Rajasthan 302015'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#4A5654] pt-1">
              <span className="font-mono font-medium">{pt.gstin || 'GSTIN: 08AAAAA0000A1Z5'}</span>
              <span>•</span>
              <span>{pt.sacCode || 'SAC: 999293 (Tuition & Coaching Services)'}</span>
              <span>•</span>
              <span>State: Rajasthan (08)</span>
            </div>
          </div>

          {/* Invoice Meta & Billed To Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Invoice Info */}
            <div className="bg-[#FAF8F4] p-3.5 rounded-xl border border-[#E7E3DA] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7A8582]">{pt.receiptNo || 'Receipt No.'}:</span>
                <span className="font-mono font-bold text-[#14211F]">{receipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8582]">{pt.invoiceDate || 'Date of Issue'}:</span>
                <span className="font-medium text-[#14211F] tabular-nums">{formatDate(receipt.issuedAt, lang)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8582]">{pt.paymentMode || 'Payment Mode'}:</span>
                <span className="font-medium text-[#14211F] uppercase">UPI / Online Netbanking</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8582]">Status:</span>
                <span className="font-medium text-[#1F7A4D]">Payment Received</span>
              </div>
            </div>

            {/* Student & Guardian Info */}
            <div className="bg-[#FAF8F4] p-3.5 rounded-xl border border-[#E7E3DA] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#7A8582]">{pt.studentName || 'Student Name'}:</span>
                <span className="font-bold text-[#14211F]">{student?.name || 'Student'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8582]">{pt.studentId || 'Student ID'}:</span>
                <span className="font-mono font-medium text-[#14211F]">{student?.studentId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8582]">{pt.courseBatch || 'Course & Batch'}:</span>
                <span className="font-medium text-[#14211F]">{student?.batch || student?.course || 'JEE/NEET Classroom'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A8582]">Parent/Guardian:</span>
                <span className="font-medium text-[#14211F]">{user?.name || 'Parent'}</span>
              </div>
            </div>
          </div>

          {/* Tax Breakdown Table */}
          <div className="border border-[#E7E3DA] rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F4] border-b border-[#E7E3DA] text-[#7A8582] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">{pt.description || 'Description'}</th>
                  <th className="p-3 text-right">{pt.taxableValue || 'Taxable Value'}</th>
                  <th className="p-3 text-right">{pt.cgst || 'CGST (9%)'}</th>
                  <th className="p-3 text-right">{pt.sgst || 'SGST (9%)'}</th>
                  <th className="p-3 text-right">{pt.total || 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]">
                <tr>
                  <td className="p-3 text-[#7A8582]">1</td>
                  <td className="p-3">
                    <span className="font-medium text-[#14211F] block">
                      {pt.tuitionFeeDescription || 'Tuition & Coaching Fee (Classroom Course)'}
                    </span>
                    <span className="text-[11px] text-[#7A8582]">SAC Code: 999293</span>
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums text-[#4A5654]">
                    {formatPaise(taxablePaise)}
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums text-[#4A5654]">
                    {formatPaise(cgstPaise)}
                  </td>
                  <td className="p-3 text-right font-mono tabular-nums text-[#4A5654]">
                    {formatPaise(sgstPaise)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold tabular-nums text-[#14211F]">
                    {formatPaise(receipt.amountPaise)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-[#FAF8F4] border-t-2 border-[#14211F] font-semibold text-[#14211F]">
                <tr>
                  <td colSpan={5} className="p-3 text-right uppercase tracking-wider text-xs">
                    {pt.total || 'Total Amount Received'}:
                  </td>
                  <td className="p-3 text-right font-serif text-base text-[#0E4D44] tabular-nums">
                    {formatPaise(receipt.amountPaise)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tax Summary Note */}
          <div className="bg-[#E6F0EE]/60 rounded-xl p-3 text-xs text-[#0E4D44] border border-[#0E4D44]/15 flex items-center justify-between">
            <span>
              <strong>GST Summary: </strong>
              Taxable Amount: {formatPaise(taxablePaise)} + Total GST (18%): {formatPaise(totalGstPaise)}
            </span>
            <span className="font-medium bg-white px-2 py-0.5 rounded border border-[#0E4D44]/20">
              Paid in Full
            </span>
          </div>

          {/* Signatory & Legal Declaration */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-t border-[#E7E3DA] text-xs text-[#7A8582]">
            <p className="max-w-xs text-[11px]">
              {pt.computerGenerated || 'This is a computer-generated tax invoice under GST Rules. No physical signature required.'}
            </p>

            <div className="text-right space-y-1">
              <div className="font-serif font-semibold text-sm text-[#0E4D44]">
                FeeDesk Coaching Institute
              </div>
              <div className="text-[11px] text-[#7A8582]">
                {pt.authorizedSignatory || 'Authorized Accounts Department'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
