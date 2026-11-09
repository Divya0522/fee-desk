import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { User, Briefcase } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import PhoneStep from '../components/auth/PhoneStep'
import OtpInput from '../components/auth/OtpInput'
import StaffForm from '../components/auth/StaffForm'
import { useAuth } from '../context/useAuth'
import * as authApi from '../services/authApi'
import { useLang } from '../i18n/useLang'

export default function SignIn() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { loginWithOtp, loginStaff, showToast } = useAuth()

  // Active tab: 'parent' | 'staff'
  const initialRole = searchParams.get('role') === 'staff' ? 'staff' : 'parent'
  const [activeTab, setActiveTab] = useState(initialRole)

  // Parent flow step: 1 (phone) | 2 (otp)
  const [parentStep, setParentStep] = useState(1)
  const [phone, setPhone] = useState('')

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setServerError(null)
    setParentStep(1)
    if (tab === 'staff') {
      setSearchParams({ role: 'staff' }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  // Handle Parent Step 1: Send OTP
  const handlePhoneSubmit = async (cleanedPhone) => {
    setIsLoading(true)
    setServerError(null)
    try {
      await authApi.sendOtp({ phone: cleanedPhone, purpose: 'signin' })
      setPhone(cleanedPhone)
      setParentStep(2)
    } catch (err) {
      setServerError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Parent Step 2: Verify OTP
  const handleOtpSubmit = async (otpCode) => {
    setIsLoading(true)
    setServerError(null)
    try {
      const authUser = await loginWithOtp(phone, otpCode)
      if (authUser?.isActivated === false) {
        showToast(
          isHindi
            ? 'OTP सत्यापित! खाता सक्रिय करने के लिए अभिभावक सहमति विवरण भरें।'
            : 'OTP verified! One final step: confirm guardian details to activate.',
          'info'
        )
        const studentId = authUser.studentIds?.[0] || ''
        navigate('/signup', {
          state: {
            phone,
            studentId,
            verified: true,
          },
          replace: true,
        })
        return
      }
      const destination = location.state?.from?.pathname || '/portal'
      navigate(destination, { replace: true })
    } catch (err) {
      setServerError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setServerError(null)
    try {
      await authApi.sendOtp({ phone, purpose: 'signin' })
    } catch (err) {
      setServerError(err)
    }
  }

  // Handle Staff Login
  const handleStaffSubmit = async ({ email, password }) => {
    setIsLoading(true)
    setServerError(null)
    try {
      const authenticatedUser = await loginStaff(email, password)
      let destination = location.state?.from?.pathname
      if (!destination || destination === '/signin' || destination === '/') {
        destination = authenticatedUser?.role === 'admin' ? '/admin' : '/accounts'
      }
      navigate(destination, { replace: true })
    } catch (err) {
      setServerError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const pageTitle = isHindi ? 'लॉगिन करें' : 'Welcome back'
  const pageSubtitle =
    activeTab === 'parent'
      ? isHindi
        ? 'अपने बच्चे की फीस, रसीदें और बकाया स्थिति देखें'
        : 'View your child’s dues, past receipts, and payment status'
      : isHindi
        ? 'सेंटर फीस, एजिंग और टैली एक्सपोर्ट प्रबंधन'
        : 'Centre dues management, ageing reports, and Tally export'

  return (
    <AuthLayout title={pageTitle} subtitle={pageSubtitle}>
      {/* Segmented Tab Control */}
      <div className="auth-tab-segment" role="tablist" aria-label="Sign in role">
        <button
          type="button"
          role="tab"
          id="tab-parent"
          aria-selected={activeTab === 'parent'}
          aria-controls="panel-parent"
          className={`auth-tab-btn ${activeTab === 'parent' ? 'active' : ''}`}
          onClick={() => handleTabChange('parent')}
        >
          <User size={15} aria-hidden="true" />
          <span>{isHindi ? 'पैरेंट (OTP)' : 'Parent (OTP)'}</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-staff"
          aria-selected={activeTab === 'staff'}
          aria-controls="panel-staff"
          className={`auth-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => handleTabChange('staff')}
        >
          <Briefcase size={15} aria-hidden="true" />
          <span>{isHindi ? 'स्टाफ' : 'Staff'}</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'parent' ? (
        <div id="panel-parent" role="tabpanel" aria-labelledby="tab-parent">
          {parentStep === 1 ? (
            <PhoneStep
              onSubmit={handlePhoneSubmit}
              isLoading={isLoading}
              serverError={serverError}
              initialPhone={phone}
            />
          ) : (
            <OtpInput
              phone={phone}
              onSubmit={handleOtpSubmit}
              onResend={handleResendOtp}
              onChangePhone={() => {
                setParentStep(1)
                setServerError(null)
              }}
              isLoading={isLoading}
              serverError={serverError}
            />
          )}
        </div>
      ) : (
        <div id="panel-staff" role="tabpanel" aria-labelledby="tab-staff">
          <StaffForm
            onSubmit={handleStaffSubmit}
            isLoading={isLoading}
            serverError={serverError}
          />
        </div>
      )}
    </AuthLayout>
  )
}
