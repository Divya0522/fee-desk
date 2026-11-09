import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  MinusCircle,
  Check,
  X,
  XCircle,
  PhoneCall,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react'
import { useLang } from '../../i18n/useLang'

const STATUS_CONFIGS = {
  // Instalment & Fee statuses
  paid: {
    en: 'Paid',
    hi: 'भुगतान प्राप्त',
    icon: CheckCircle2,
    className: 'chip-status-paid',
  },
  overdue: {
    en: 'Overdue',
    hi: 'अतिदेय',
    icon: AlertCircle,
    className: 'chip-status-overdue',
  },
  due: {
    en: 'Due',
    hi: 'देय',
    icon: Clock,
    className: 'chip-status-due',
  },
  due_soon: {
    en: 'Due soon',
    hi: 'शीघ्र देय',
    icon: Clock,
    className: 'chip-status-due-soon',
  },
  part_paid: {
    en: 'Part paid',
    hi: 'आंशिक भुगतान',
    icon: MinusCircle,
    className: 'chip-status-part-paid',
  },

  // Risk Flag levels
  high: {
    en: 'High risk',
    hi: 'उच्च जोखिम',
    icon: AlertTriangle,
    className: 'chip-risk-high',
  },
  medium: {
    en: 'Medium risk',
    hi: 'मध्यम जोखिम',
    icon: AlertCircle,
    className: 'chip-risk-medium',
  },
  low: {
    en: 'Low risk',
    hi: 'कम जोखिम',
    icon: ShieldCheck,
    className: 'chip-risk-low',
  },

  // Refund & General statuses
  calculated: {
    en: 'Calculated',
    hi: 'परिकलित',
    icon: Clock,
    className: 'chip-status-due',
  },
  approved: {
    en: 'Approved',
    hi: 'स्वीकृत',
    icon: Check,
    className: 'chip-status-info',
  },
  rejected: {
    en: 'Rejected',
    hi: 'अस्वीकृत',
    icon: X,
    className: 'chip-status-overdue',
  },

  // Payment queue & task statuses
  open: {
    en: 'Open',
    hi: 'लंबित',
    icon: AlertCircle,
    className: 'chip-status-due',
  },
  matched: {
    en: 'Matched',
    hi: 'समायोजित',
    icon: CheckCircle2,
    className: 'chip-status-paid',
  },
  contacted: {
    en: 'Contacted',
    hi: 'संपर्क किया',
    icon: PhoneCall,
    className: 'chip-status-info',
  },
  false_flag: {
    en: 'False flag',
    hi: 'गलत फ़्लैग',
    icon: XCircle,
    className: 'chip-status-muted',
  },
  resolved: {
    en: 'Resolved',
    hi: 'समाधानित',
    icon: CheckCheck,
    className: 'chip-status-paid',
  },
  scheduled: {
    en: 'Scheduled',
    hi: 'निर्धारित',
    icon: Clock,
    className: 'chip-status-due',
  },
  sent: {
    en: 'Sent',
    hi: 'भेजा गया',
    icon: CheckCircle2,
    className: 'chip-status-paid',
  },
  skipped_paid: {
    en: 'Stopped: paid',
    hi: 'रोका गया: चुकता',
    icon: Check,
    className: 'chip-status-muted',
  },
  cancelled: {
    en: 'Cancelled',
    hi: 'रद्द',
    icon: X,
    className: 'chip-status-muted',
  },
}

export default function StatusChip({ status, label, icon: CustomIcon, size = 'sm' }) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const normalizedStatus = String(status || '').toLowerCase()
  const config = STATUS_CONFIGS[normalizedStatus] || {
    en: status || '—',
    hi: status || '—',
    icon: Clock,
    className: 'chip-status-muted',
  }

  const displayText = label || (isHindi ? config.hi : config.en)
  const IconComponent = CustomIcon || config.icon

  return (
    <span
      className={`status-chip ${config.className} chip-${size}`}
      role="status"
      aria-label={displayText}
    >
      {IconComponent && <IconComponent size={size === 'xs' ? 12 : 14} aria-hidden="true" />}
      <span>{displayText}</span>
    </span>
  )
}
