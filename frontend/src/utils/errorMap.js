/**
 * Maps Backend Error Codes to localized User-Facing Messages
 */

export function getErrorMessage(err, lang = 'en') {
  if (!err) return null
  const isHindi = lang === 'hi'
  const code = err.code || ''

  switch (code) {
    case 'INVALID_OTP':
      return isHindi
        ? 'गलत 6-अंकीय OTP दर्ज किया गया है। कृपया जांचें और पुनः प्रयास करें।'
        : 'Incorrect 6-digit OTP entered. Please check and try again.'

    case 'OTP_EXPIRED':
      return isHindi
        ? 'OTP की समय सीमा समाप्त हो गई है। कृपया नया कोड मंगवाएं।'
        : 'This OTP has expired. Please request a new one.'

    case 'ACCOUNT_LOCKED':
    case 'OTP_RATE_LIMIT_EXCEEDED': {
      const sec = err.retryAfterSec || 300
      const mins = Math.ceil(sec / 60)
      return isHindi
        ? `बहुत सारे असफल प्रयासों के कारण सुरक्षा हेतु लॉक किया गया है। कृपया ${mins} मिनट (${sec}s) बाद पुनः प्रयास करें।`
        : `Temporarily locked due to too many failed attempts. Please retry in ${mins} minute(s) (${sec}s).`
    }

    case 'STUDENT_NOT_FOUND':
    case 'NOT_FOUND':
    case 'STUDENT_LOOKUP_FAILED':
      return isHindi
        ? 'यह छात्र आईडी या पंजीकृत फोन नंबर संस्थान के रिकॉर्ड में नहीं मिला।'
        : 'Could not find any student matching this ID and registered mobile number.'

    case 'UNACTIVATED_ACCOUNT':
      return isHindi
        ? 'यह खाता अभी सक्रिय नहीं है। कृपया पहले नीचे दिए गए लिंक से सक्रियण पूरा करें।'
        : 'This account is not activated yet. Please complete one-time activation first.'

    case 'INVALID_CREDENTIALS':
      return isHindi
        ? 'ईमेल या पासवर्ड अमान्य है।'
        : 'Email or password is incorrect.'

    case 'OFFLINE':
      return isHindi
        ? 'सर्वर से संपर्क नहीं हो पा रहा है। कृपया अपना इंटरनेट कनेक्शन जांचें।'
        : 'Unable to reach the FeeDesk server. Please check your connection.'

    case 'CONSENT_REQUIRED':
      return isHindi
        ? 'आगे बढ़ने के लिए डीपीरेपी अधिनियम (DPDP Act 2023) सहमति अनिवार्य है।'
        : 'Parental consent under the DPDP Act 2023 is required to activate.'

    case 'VALIDATION_ERROR':
      return isHindi
        ? 'कृपया फ़ॉर्म में दी गई जानकारी की जाँच करें।'
        : 'Please check the details entered in the form.'

    default:
      return err.message || (isHindi ? 'अनपेक्षित त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'An unexpected error occurred.')
  }
}

/**
 * Extracts field-specific errors from Zod / backend validation details
 */
export function getFieldErrors(err) {
  if (!err || !err.details || !Array.isArray(err.details)) return {}
  const errors = {}
  err.details.forEach((item) => {
    if (item.path) {
      errors[item.path] = item.message
    } else if (item.field) {
      errors[item.field] = item.message
    }
  })
  return errors
}
