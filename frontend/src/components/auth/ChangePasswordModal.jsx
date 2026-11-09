import { useState } from 'react'
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../i18n/useLang'
import * as authApi from '../../services/authApi'

export default function ChangePasswordModal({ isOpen, onSuccess, forced = false }) {
  const { user, setUser, showToast } = useAuth()
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  // Password validation rules
  const hasLength = newPassword.length >= 8
  const hasLetter = /[A-Za-z]/.test(newPassword)
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
  const matchesConfirm = newPassword && newPassword === confirmPassword
  const isDifferent = newPassword && newPassword !== currentPassword
  const isValid = hasLength && hasLetter && hasNumberOrSymbol && matchesConfirm && isDifferent

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError(null)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      showToast(
        isHindi
          ? 'पासवर्ड सफलतापूर्वक बदल दिया गया!'
          : 'Password updated successfully! Your account is now secured.',
        'success'
      )
      if (user) {
        setUser({ ...user, mustChangePassword: false })
      }
      onSuccess?.()
    } catch (err) {
      setError(err.message || (isHindi ? 'पासवर्ड बदलने में विफल' : 'Failed to change password'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14211F]/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF4E0] text-[#9A5B0B] flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-[#14211F]">
              {forced
                ? isHindi
                  ? 'पासवर्ड बदलना अनिवार्य है'
                  : 'Change Temporary Password'
                : isHindi
                ? 'पासवर्ड बदलें'
                : 'Change Password'}
            </h2>
            <p className="text-xs text-[#4A5654] mt-0.5 leading-relaxed">
              {forced
                ? isHindi
                  ? 'अस्थायी पासवर्ड से लॉगिन किया गया है। जारी रखने के लिए कृपया एक व्यक्तिगत सुरक्षित पासवर्ड सेट करें।'
                  : 'A temporary password was assigned to your account. Please set a secure permanent password to continue.'
                : isHindi
                ? 'अपने खाते की सुरक्षा के लिए नया पासवर्ड दर्ज करें।'
                : 'Enter your current password and choose a secure new password.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#B3261E]/30 text-xs text-[#B3261E] flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-[#4A5654] mb-1">
              {forced
                ? isHindi
                  ? 'अस्थायी पासवर्ड (Temporary Password)'
                  : 'Temporary / Current Password'
                : isHindi
                ? 'वर्तमान पासवर्ड'
                : 'Current Password'}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full h-10 pl-3 pr-10 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8582] hover:text-[#14211F]"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-[#4A5654] mb-1">
              {isHindi ? 'नया पासवर्ड' : 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="At least 8 chars with letter & number"
                className="w-full h-10 pl-3 pr-10 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8582] hover:text-[#14211F]"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[#4A5654] mb-1">
              {isHindi ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-type new password"
              className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
            />
          </div>

          {/* Strength Checklist */}
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-1.5 text-[11px]">
            <div className={`flex items-center gap-1.5 ${hasLength ? 'text-[#1F7A4D]' : 'text-[#7A8582]'}`}>
              <CheckCircle2 size={12} className={hasLength ? 'text-[#1F7A4D]' : 'text-[#7A8582] opacity-40'} />
              <span>At least 8 characters long</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-[#1F7A4D]' : 'text-[#7A8582]'}`}>
              <CheckCircle2 size={12} className={hasLetter ? 'text-[#1F7A4D]' : 'text-[#7A8582] opacity-40'} />
              <span>Contains at least one letter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-[#1F7A4D]' : 'text-[#7A8582]'}`}>
              <CheckCircle2 size={12} className={hasNumberOrSymbol ? 'text-[#1F7A4D]' : 'text-[#7A8582] opacity-40'} />
              <span>Contains at least one number or symbol</span>
            </div>
            {confirmPassword && (
              <div className={`flex items-center gap-1.5 ${matchesConfirm ? 'text-[#1F7A4D]' : 'text-[#B3261E]'}`}>
                <CheckCircle2 size={12} className={matchesConfirm ? 'text-[#1F7A4D]' : 'text-[#B3261E]'} />
                <span>Passwords match</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full h-11 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-2"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            <span>{isHindi ? 'पासवर्ड सहेजें और आगे बढ़ें' : 'Save New Password & Continue'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
