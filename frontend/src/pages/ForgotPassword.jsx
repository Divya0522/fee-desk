import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Mail, Phone } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import { useLang } from '../i18n/useLang'

export default function ForgotPassword() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  return (
    <AuthLayout
      title={isHindi ? 'पासवर्ड रीसेट' : 'Password Reset'}
      subtitle={
        isHindi
          ? 'सुरक्षा कारणों से स्टाफ पासवर्ड सेंटर एडमिन द्वारा रीसेट किए जाते हैं'
          : 'For security reasons, staff credentials are managed by centre administrators'
      }
    >
      <div className="forgot-password-card">
        <div className="forgot-icon-box" aria-hidden="true">
          <ShieldAlert size={28} />
        </div>

        <h3 className="forgot-title">
          {isHindi ? 'सेंटर एडमिन से संपर्क करें' : 'Contact your centre admin'}
        </h3>

        <p className="forgot-desc">
          {isHindi
            ? 'FeeDesk पर स्टाफ और अकाउंट्स एग्जीक्यूटिव के पासवर्ड कोचिंग संस्थान के मुख्य व्यवस्थापक (Admin) द्वारा सेट और रीसेट किए जाते हैं।'
            : 'Staff and accounts executive credentials on FeeDesk are issued and reset directly by your coaching institute’s primary administrator.'}
        </p>

        <div className="forgot-steps-box">
          <div className="forgot-step-row">
            <Mail size={16} aria-hidden="true" />
            <span>
              {isHindi
                ? 'अपने सेंटर एडमिन को अनुरोध भेजें'
                : 'Send a reset request to your centre administrator'}
            </span>
          </div>
          <div className="forgot-step-row">
            <Phone size={16} aria-hidden="true" />
            <span>
              {isHindi
                ? 'सहायता डेस्क: support@feedesk.demo'
                : 'Helpdesk support: support@feedesk.demo'}
            </span>
          </div>
        </div>

        <div className="auth-switch-box">
          <Link to="/signin?role=staff" className="btn btn-primary auth-btn-submit">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{isHindi ? 'स्टाफ लॉगिन पर वापस जाएं' : 'Back to staff sign in'}</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
