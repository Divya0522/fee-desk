import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function FinalCTA({ t }) {
  const { user, role, logout } = useAuth()
  const { final } = t

  return (
    <section className="final-cta-section" aria-labelledby="final-cta-heading">
      <div className="site-container">
        <div className="final-cta-card">
          <div className="final-cta-content">
            <h2 id="final-cta-heading" className="final-cta-title">
              {final.title}
            </h2>
            <p className="final-cta-sub">
              {final.text}
            </p>

            <div className="final-cta-actions">
              {user ? (
                <>
                  <Link
                    to={role === 'parent' ? '/portal' : '/accounts'}
                    className="btn-final-white"
                  >
                    {role === 'parent' ? 'Open Parent Portal' : 'Open Accounts Dashboard'}
                  </Link>
                  <button
                    type="button"
                    className="btn-final-outline"
                    onClick={logout}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/signin" className="btn-final-white">
                    {final.parent}
                  </Link>
                  <Link to="/signin?role=staff" className="btn-final-outline">
                    {final.staff}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
