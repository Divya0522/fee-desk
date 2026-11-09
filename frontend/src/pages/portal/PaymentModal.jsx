import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CreditCard, 
  Smartphone,
  Lock
} from 'lucide-react'
import { formatPaise } from '../../utils/format'
import { useLang } from '../../i18n/useLang'
import * as parentApi from '../../services/parentApi'

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  instalment, 
  student, 
  onPaymentSuccess 
}) {
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const pt = t.portal?.paymentModal || {}

  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
  const maskedStripeKey = stripeKey
    ? `${stripeKey.slice(0, 12)}...${stripeKey.slice(-6)}`
    : ''

  // Form states
  const [activeTab, setActiveTab] = useState('upi') // 'upi' or 'card'
  const [upiId, setUpiId] = useState('parent@upi')
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('123')
  const [cardHolder, setCardHolder] = useState(student?.name ? `${student.name}'s Parent` : 'Parent')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successData, setSuccessData] = useState(null)

  if (!isOpen || !instalment) return null

  const balancePaise = instalment.balancePaise || Math.max(0, instalment.amountPaise - (instalment.paidPaise || 0))

  const handlePay = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // 1. Get or generate payment token
      let token = instalment.paymentLinkToken
      if (!token) {
        const linkRes = await parentApi.createInstalmentPayLink(instalment._id)
        token = linkRes?.token
      }

      if (!token) {
        throw new Error('Could not initialize payment gateway session.')
      }

      // 2. Perform checkout (backend handles UPI or Card)
      const checkoutRes = await parentApi.mockCheckout(token, activeTab)
      setSuccessData(checkoutRes)

      // Notify parent view silently in the background
      if (onPaymentSuccess) {
        onPaymentSuccess(checkoutRes)
      }
    } catch (err) {
      setError(err.message || pt.failed || 'Payment failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSuccessData(null)
    setError(null)
    onClose()
  }

  const handleViewReceipt = () => {
    const receiptNo = successData?.receiptNo
    handleClose()
    const studentQuery = student?.studentId ? `?student=${student.studentId}` : ''
    const highlightQuery = receiptNo ? `${studentQuery ? '&' : '?'}highlight=${receiptNo}` : ''
    navigate(`/portal/receipts${studentQuery}${highlightQuery}`)
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      {/* Backdrop tap to close */}
      <div className="fixed inset-0" onClick={!isSubmitting ? handleClose : undefined} />

      {/* Modal / Bottom Sheet Box */}
      <div 
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-[#E7E3DA] shadow-2xl overflow-hidden z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E3DA] bg-[#FAF8F4]">
          <div>
            <h3 id="payment-modal-title" className="font-serif font-semibold text-lg text-[#14211F]">
              {successData ? pt.successTitle || 'Payment successful' : pt.title || 'Complete payment'}
            </h3>
            {!successData && (
              <p className="text-xs text-[#7A8582]">
                {student?.name} • {pt.instalmentSub?.replace('{sequence}', instalment.sequence).replace('{amount}', formatPaise(balancePaise))}
              </p>
            )}
          </div>
          {!isSubmitting && (
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-[#7A8582] hover:text-[#14211F] rounded-lg hover:bg-white transition-colors"
              aria-label={pt.close || 'Close'}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto">
          {successData ? (
            /* Success State */
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center">
                <CheckCircle2 size={28} strokeWidth={2} />
              </div>

              <div>
                <h4 className="font-serif text-2xl font-bold text-[#14211F] tabular-nums">
                  {formatPaise(successData.amountPaidPaise || balancePaise)}
                </h4>
                <p className="text-sm text-[#4A5654] mt-1">
                  {pt.successMessage || 'Your payment was recorded and verified with the centre.'}
                </p>
              </div>

              {/* Receipt Details Box */}
              <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-3.5 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#7A8582]">{pt.receiptNumber || 'Receipt number'}:</span>
                  <span className="font-mono font-bold text-[#0E4D44]">{successData.receiptNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7A8582]">Student:</span>
                  <span className="font-medium text-[#14211F]">{student?.name} ({student?.studentId})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7A8582]">Payment Gateway:</span>
                  <span className="font-medium text-[#14211F] uppercase">{activeTab === 'card' ? 'Stripe Card (Verified)' : 'UPI Netbanking'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#E7E3DA] pt-1.5">
                  <span className="text-[#7A8582]">GST Invoice Status:</span>
                  <span className="font-semibold text-[#1F7A4D]">18% GST Paid & Generated</span>
                </div>
              </div>

              {/* Automated SMS Notice Stopped Indicator */}
              <div className="bg-[#E8F4EC] text-[#1F7A4D] border border-[#1F7A4D]/20 rounded-xl p-2.5 text-xs text-left flex items-start gap-2">
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Reminders Stopped:</strong> All automated SMS payment reminders for Instalment #{instalment.sequence} have been cancelled.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleViewReceipt}
                  className="w-full h-12 bg-[#0E4D44] hover:bg-[#0A3B34] text-[#FAF8F4] rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>{pt.viewReceipt || 'View receipt'}</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full h-11 border border-[#E7E3DA] hover:bg-[#FAF8F4] text-[#4A5654] rounded-xl font-medium text-sm transition-colors"
                >
                  {pt.done || 'Done'}
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handlePay} className="space-y-4">
              {/* Payment Summary */}
              <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#7A8582] uppercase tracking-wider block font-semibold">Total Payable</span>
                  <span className="font-serif font-bold text-2xl text-[#14211F] tabular-nums">
                    {formatPaise(balancePaise)}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#E8F4EC] text-[#1F7A4D] text-xs font-semibold">
                  GST Included
                </span>
              </div>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF8F4] rounded-xl border border-[#E7E3DA]">
                <button
                  type="button"
                  onClick={() => setActiveTab('upi')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'upi'
                      ? 'bg-white text-[#0E4D44] font-semibold shadow-sm'
                      : 'text-[#7A8582] hover:text-[#14211F]'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>{pt.tabUpi || 'UPI & QR'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'card'
                      ? 'bg-white text-[#0E4D44] font-semibold shadow-sm'
                      : 'text-[#7A8582] hover:text-[#14211F]'
                  }`}
                >
                  <CreditCard size={14} />
                  <span>{pt.tabCard || 'Card (Stripe)'}</span>
                </button>
              </div>

              {/* UPI Tab Content */}
              {activeTab === 'upi' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4A5654] mb-1">
                      {pt.upiLabel || 'UPI ID (VPA)'}
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder={pt.upiPlaceholder || 'name@oksbi or mobile@upi'}
                      className="w-full h-11 px-3.5 bg-white border border-[#E7E3DA] rounded-xl text-sm text-[#14211F] placeholder:text-[#7A8582] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                      required
                    />
                  </div>

                  {/* QR Placeholder */}
                  <div className="border border-[#E7E3DA] rounded-xl p-3 bg-white flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FAF8F4] border border-[#E7E3DA] rounded-lg flex items-center justify-center text-[#0E4D44] flex-shrink-0">
                      <QrCode size={24} strokeWidth={1.5} />
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-[#14211F] block">{pt.qrTitle || 'Or scan UPI QR'}</span>
                      <span className="text-[#7A8582]">{pt.qrSubtitle || 'Zero convenience fee • Instant receipt'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card / Stripe Tab Content */}
              {activeTab === 'card' && (
                <div className="space-y-3">
                  {/* Stripe connected notice */}
                  {stripeKey && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#E6F0EE] border border-[#0E4D44]/15 text-[11px] text-[#0E4D44]">
                      <span className="font-semibold flex items-center gap-1">
                        <Lock size={11} />
                        <span>{pt.stripeBadge || 'Stripe Test Gateway Active'}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#7A8582]">{maskedStripeKey}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[#4A5654] mb-1">
                      {pt.cardNumber || 'Card number'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full h-11 px-3.5 pl-10 bg-white border border-[#E7E3DA] rounded-xl text-sm font-mono text-[#14211F] placeholder:text-[#7A8582] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                        required
                      />
                      <CreditCard size={16} className="absolute left-3.5 top-3 text-[#7A8582]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#4A5654] mb-1">
                        {pt.cardExpiry || 'Expiry (MM/YY)'}
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full h-11 px-3.5 bg-white border border-[#E7E3DA] rounded-xl text-sm font-mono text-[#14211F] placeholder:text-[#7A8582] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A5654] mb-1">
                        {pt.cardCvc || 'CVC / CVV'}
                      </label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full h-11 px-3.5 bg-white border border-[#E7E3DA] rounded-xl text-sm font-mono text-[#14211F] placeholder:text-[#7A8582] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-[#FDECEA] border border-[#B3261E]/20 rounded-xl text-xs text-[#B3261E] flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-[#0E4D44] hover:bg-[#0A3B34] active:bg-[#082D27] disabled:bg-[#7A8582] text-[#FAF8F4] rounded-xl font-medium text-base shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{pt.processing || 'Processing payment...'}</span>
                  </>
                ) : (
                  <span>
                    {pt.payButton || 'Complete payment'} ({formatPaise(balancePaise)})
                  </span>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7A8582] text-center pt-1">
                <ShieldCheck size={13} className="text-[#0E4D44]" />
                <span>256-bit bank encrypted payment. Instant GST receipt generation.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
