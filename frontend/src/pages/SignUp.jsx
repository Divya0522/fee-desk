import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/auth/AuthLayout'
import Stepper from '../components/auth/Stepper'
import ActivationStep1 from '../components/auth/ActivationStep1'
import OtpInput from '../components/auth/OtpInput'
import ActivationStep3 from '../components/auth/ActivationStep3'
import { useAuth } from '../context/useAuth'
import * as authApi from '../services/authApi'
import { useLang } from '../i18n/useLang'

export default function SignUp() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const navigate = useNavigate()
  const location = useLocation()
  const { activate } = useAuth()

  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState(location.state?.phone || '')
  const [studentId, setStudentId] = useState(location.state?.studentId || '')
  const [studentData, setStudentData] = useState(null)

  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Auto-advance to Step 3 if user already verified OTP during sign in
  useEffect(() => {
    const handlePreVerified = async () => {
      const incomingPhone = location.state?.phone
      const incomingStudentId = location.state?.studentId
      const isVerified = location.state?.verified

      if (incomingPhone) setPhone(incomingPhone)
      if (incomingStudentId) setStudentId(incomingStudentId)

      if (isVerified && incomingPhone && incomingStudentId) {
        setIsLoading(true)
        try {
          const student = await authApi.lookupStudent({ phone: incomingPhone, studentId: incomingStudentId })
          setStudentData(student)
          setStep(3)
        } catch {
          setStep(1)
        } finally {
          setIsLoading(false)
        }
      }
    }

    handlePreVerified()
  }, [location.state])

  // Step 1: Lookup student and trigger OTP
  const handleStep1Submit = async ({ phone: cleanPhone, studentId: cleanId }) => {
    setIsLoading(true)
    setServerError(null)
    try {
      const student = await authApi.lookupStudent({ phone: cleanPhone, studentId: cleanId })
      await authApi.sendOtp({ phone: cleanPhone, purpose: 'activation' })
      setPhone(cleanPhone)
      setStudentId(cleanId)
      setStudentData(student)
      setStep(2)
    } catch (err) {
      setServerError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleStep2Submit = async (otpCode) => {
    setIsLoading(true)
    setServerError(null)
    try {
      // Validate OTP
      await authApi.verifyOtp({ phone, otp: otpCode })
      setStep(3)
    } catch (err) {
      setServerError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    setServerError(null)
    try {
      await authApi.sendOtp({ phone, purpose: 'activation' })
    } catch (err) {
      setServerError(err)
    }
  }

  // Step 3: Complete Activation with DPDP Consent
  const handleStep3Submit = async (consentData) => {
    setIsLoading(true)
    setServerError(null)
    try {
      await activate({
        phone,
        studentId,
        ...consentData,
      })
      navigate('/portal', { replace: true })
    } catch (err) {
      setServerError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const pageTitle = isHindi ? 'अभिभावक खाता सक्रियण' : 'Activate Parent Account'
  const pageSubtitle = isHindi
    ? 'अपने बच्चे के फीस रिकॉर्ड तक सुरक्षित पहुंच प्राप्त करें'
    : 'Secure, consent-based fee tracking for coaching families'

  return (
    <AuthLayout title={pageTitle} subtitle={pageSubtitle}>
      {/* 3-Step Progress Indicator */}
      <Stepper currentStep={step} totalSteps={3} />

      {/* Step 1: Find your child */}
      {step === 1 && (
        <ActivationStep1
          onSubmit={handleStep1Submit}
          isLoading={isLoading}
          serverError={serverError}
          initialPhone={phone}
          initialStudentId={studentId}
        />
      )}

      {/* Step 2: Verify OTP */}
      {step === 2 && (
        <OtpInput
          phone={phone}
          onSubmit={handleStep2Submit}
          onResend={handleResendOtp}
          onChangePhone={() => {
            setStep(1)
            setServerError(null)
          }}
          isLoading={isLoading}
          serverError={serverError}
        />
      )}

      {/* Step 3: Consent & Profile */}
      {step === 3 && (
        <ActivationStep3
          student={studentData}
          onSubmit={handleStep3Submit}
          isLoading={isLoading}
          serverError={serverError}
        />
      )}
    </AuthLayout>
  )
}
