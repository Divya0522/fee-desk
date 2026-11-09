import { Check } from 'lucide-react'
import { useLang } from '../../i18n/useLang'

export default function Stepper({ currentStep = 1, totalSteps = 3 }) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const stepLabels = isHindi
    ? ['विद्यार्थी खोजें', 'OTP सत्यापन', 'सहमति और विवरण']
    : ['Find student', 'Verify phone', 'Consent & details']

  return (
    <div className="auth-stepper-v2" aria-label={`Step ${currentStep} of ${totalSteps}`}>
      {/* Step Numbers & Labels */}
      <div className="stepper-steps-row">
        {[1, 2, 3].map((stepNum) => {
          const isCompleted = stepNum < currentStep
          const isActive = stepNum === currentStep
          return (
            <div
              key={stepNum}
              className={`stepper-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="stepper-indicator">
                {isCompleted ? (
                  <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <span>{stepNum}</span>
                )}
              </div>
              <span className="stepper-node-label">{stepLabels[stepNum - 1]}</span>
            </div>
          )
        })}
      </div>

      {/* Segmented Progress Bar */}
      <div className="stepper-track-v2" aria-hidden="true">
        <div
          className="stepper-progress-fill"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}
