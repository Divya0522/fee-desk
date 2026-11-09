import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const isError = toast.type === 'error'
  const isInfo = toast.type === 'info'

  return (
    <div
      className={`auth-toast ${isError ? 'toast-error' : isInfo ? 'toast-info' : 'toast-success'}`}
      role="status"
      aria-live="polite"
    >
      <div className="toast-icon" aria-hidden="true">
        {isError ? (
          <AlertCircle size={18} />
        ) : isInfo ? (
          <Info size={18} />
        ) : (
          <CheckCircle2 size={18} />
        )}
      </div>

      <p className="toast-message">{toast.message}</p>

      <button
        type="button"
        className="toast-close-btn"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={15} />
      </button>
    </div>
  )
}
