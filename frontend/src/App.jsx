import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './routes/ProtectedRoute'

import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import PortalPlaceholder from './pages/PortalPlaceholder'
import Privacy from './pages/Privacy'
import RefundPolicy from './pages/RefundPolicy'
import AccountsLayout from './components/accounts/AccountsLayout'
import PortalLayout from './pages/portal/PortalLayout'
import DuesView from './pages/portal/DuesView'
import ReceiptsView from './pages/portal/ReceiptsView'
import ProgressView from './pages/portal/ProgressView'
import SupportView from './pages/portal/SupportView'
import './App.css'

// Lazy-loaded staff modules to keep initial bundle compact
const DashboardView = lazy(() => import('./pages/accounts/DashboardView'))
const StudentsView = lazy(() => import('./pages/accounts/StudentsView'))
const StudentDetailView = lazy(() => import('./pages/accounts/StudentDetailView'))
const RefundsView = lazy(() => import('./pages/accounts/RefundsView'))
const UnmatchedPaymentsView = lazy(() => import('./pages/accounts/UnmatchedPaymentsView'))
const RiskFlagsView = lazy(() => import('./pages/accounts/RiskFlagsView'))
const RemindersView = lazy(() => import('./pages/accounts/RemindersView'))
const UploadsView = lazy(() => import('./pages/accounts/UploadsView'))

// Lazy-loaded admin modules
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminOverviewView = lazy(() => import('./pages/admin/OverviewView'))
const AdminStaffView = lazy(() => import('./pages/admin/StaffView'))
const AdminAuditLogView = lazy(() => import('./pages/admin/AuditLogView'))
const AdminJobsView = lazy(() => import('./pages/admin/JobsView'))
const AdminSettingsView = lazy(() => import('./pages/admin/SettingsView'))

function LoadingFallback() {
  return (
    <div className="space-y-4 py-8 animate-pulse" aria-busy="true">
      <div className="h-8 w-48 bg-white border border-[#E7E3DA] rounded-xl" />
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 space-y-3">
        <div className="h-4 w-3/4 bg-[#FAF8F4] rounded-lg" />
        <div className="h-4 w-1/2 bg-[#FAF8F4] rounded-lg" />
        <div className="h-4 w-2/3 bg-[#FAF8F4] rounded-lg" />
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Home - Only accessible when NOT logged in */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <Landing />
              </PublicOnlyRoute>
            }
          />

          {/* Guest Only Auth Routes */}
          <Route
            path="/signin"
            element={
              <PublicOnlyRoute>
                <SignIn />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignUp />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

          {/* Protected Parent Portal */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DuesView />} />
            <Route path="dues" element={<Navigate to="/portal" replace />} />
            <Route path="receipts" element={<ReceiptsView />} />
            <Route path="progress" element={<ProgressView />} />
            <Route path="support" element={<SupportView />} />
          </Route>

          {/* Protected Staff Accounts Suite */}
          <Route
            path="/accounts"
            element={
              <ProtectedRoute allowedRoles={['accounts', 'centre_admin', 'staff', 'admin']}>
                <AccountsLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <DashboardView />
                </Suspense>
              }
            />
            <Route
              path="students"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <StudentsView />
                </Suspense>
              }
            />
            <Route
              path="students/:studentId"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <StudentDetailView />
                </Suspense>
              }
            />
            <Route
              path="refunds"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <RefundsView />
                </Suspense>
              }
            />
            <Route
              path="refunds/new"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <RefundsView />
                </Suspense>
              }
            />
            <Route
              path="payments"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <UnmatchedPaymentsView />
                </Suspense>
              }
            />
            <Route
              path="risk"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <RiskFlagsView />
                </Suspense>
              }
            />
            <Route
              path="call-tasks"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <RiskFlagsView />
                </Suspense>
              }
            />
            <Route
              path="reminders"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <RemindersView />
                </Suspense>
              }
            />
            <Route
              path="uploads"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <UploadsView />
                </Suspense>
              }
            />
          </Route>

          {/* Protected Admin Suite */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Suspense fallback={<LoadingFallback />}>
                  <AdminLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminOverviewView />
                </Suspense>
              }
            />
            <Route
              path="staff"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminStaffView />
                </Suspense>
              }
            />
            <Route
              path="audit"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminAuditLogView />
                </Suspense>
              }
            />
            <Route
              path="jobs"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminJobsView />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminSettingsView />
                </Suspense>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
