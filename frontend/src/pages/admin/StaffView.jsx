import { useState } from 'react'
import {
  Users2,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  ShieldAlert,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { useAuth } from '../../context/useAuth'
import { useLang } from '../../i18n/useLang'
import { formatDate } from '../../utils/format'

const CENTRES = ['ALL', 'Jaipur Main', 'Jaipur South', 'Kota', 'Sikar']

export default function StaffView() {
  const { user: currentAdmin, showToast } = useAuth()
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [confirmToggleActive, setConfirmToggleActive] = useState(null)
  const [confirmResetStaff, setConfirmResetStaff] = useState(null)
  const [tempPasswordModal, setTempPasswordModal] = useState(null) // { title, password, userName, userEmail }
  const [copied, setCopied] = useState(false)

  // Fetch staff list
  const {
    data: responseData,
    isLoading,
    error,
    refetch,
  } = useApi(
    () =>
      adminApi.getStaff({
        search: searchTerm,
        role: roleFilter,
        active: activeFilter,
        page,
        limit: 20,
      }),
    [searchTerm, roleFilter, activeFilter, page]
  )

  const staffList = Array.isArray(responseData) ? responseData : responseData?.data || []
  const pagination = responseData?.meta || {}

  // Active admin count to enforce last admin guard on frontend
  const activeAdminCount = staffList.filter((s) => s.role === 'admin' && s.isActive !== false).length

  // Create staff handler
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    centre: 'Jaipur Main',
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const res = await adminApi.createStaff({
        ...createForm,
        role: 'accounts',
      })

      setIsCreateOpen(false)
      setCreateForm({ name: '', email: '', centre: 'Jaipur Main' })
      refetch()

      // Show temporary password modal
      setTempPasswordModal({
        title: isHindi ? 'नया स्टाफ़ खाता सफलतापूर्वक बना' : 'Staff Account Created Successfully',
        password: res.temporaryPassword,
        userName: res.user.name,
        userEmail: res.user.email,
      })
      showToast(isHindi ? 'स्टाफ़ खाता बन गया' : 'Staff account created successfully', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to create staff member', 'error')
    } finally {
      setIsCreating(false)
    }
  }

  // Edit staff handler
  const [isUpdating, setIsUpdating] = useState(false)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!editingStaff) return
    setIsUpdating(true)
    try {
      await adminApi.updateStaff(editingStaff._id, {
        name: editingStaff.name,
        centre: editingStaff.centre,
      })
      setEditingStaff(null)
      showToast(isHindi ? 'विवरण अद्यतन हुआ' : 'Staff details updated', 'success')
      refetch()
    } catch (err) {
      showToast(err.message || 'Failed to update staff', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  // Toggle active / deactivate handler
  const [isToggling, setIsToggling] = useState(false)
  const handleConfirmToggleActive = async () => {
    if (!confirmToggleActive) return
    setIsToggling(true)
    try {
      const targetState = !confirmToggleActive.isActive
      await adminApi.updateStaff(confirmToggleActive._id, {
        isActive: targetState,
      })
      showToast(
        targetState
          ? isHindi ? 'खाता पुनः सक्रिय किया गया' : 'Account reactivated successfully'
          : isHindi ? 'खाता निष्क्रिय कर दिया गया' : 'Account deactivated successfully',
        'info'
      )
      setConfirmToggleActive(null)
      refetch()
    } catch (err) {
      showToast(err.message || 'Action failed', 'error')
    } finally {
      setIsToggling(false)
    }
  }

  // Reset password handler
  const [isResetting, setIsResetting] = useState(false)
  const handleConfirmReset = async () => {
    if (!confirmResetStaff) return
    setIsResetting(true)
    try {
      const res = await adminApi.resetStaffPassword(confirmResetStaff._id)
      const target = confirmResetStaff
      setConfirmResetStaff(null)
      setTempPasswordModal({
        title: isHindi ? 'पासवर्ड रीसेट सफल' : 'Password Reset Successfully',
        password: res.temporaryPassword,
        userName: target.name,
        userEmail: target.email,
      })
      showToast(isHindi ? 'अस्थायी पासवर्ड तैयार है' : 'Temporary password generated', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error')
    } finally {
      setIsResetting(false)
    }
  }

  const handleCopyPassword = () => {
    if (tempPasswordModal?.password) {
      navigator.clipboard.writeText(tempPasswordModal.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER & ACTIONS
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
            {isHindi ? 'स्टाफ़ खाता प्रबंधन' : 'Staff Accounts'}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1 font-medium">
            {isHindi
              ? 'अकाउंट्स टीम सदस्यों का प्रबंधन, पासवर्ड रीसेट व केंद्र आवंटन'
              : 'Manage accounts executives, create new staff accounts, and handle password resets.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <UserPlus size={14} />
            <span>{isHindi ? 'नया स्टाफ़ जोड़ें' : 'Add staff'}</span>
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#0E4D44]' : ''} />
            <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          FILTERS & SEARCH
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E7E3DA] shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8582]" />
          <input
            type="text"
            placeholder={isHindi ? 'नाम, ईमेल या केंद्र से खोजें...' : 'Search by name, email, centre...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#4A5654] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          >
            <option value="ALL">All Roles</option>
            <option value="accounts">Accounts Executive</option>
            <option value="admin">Admin</option>
          </select>

          {/* Active Filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#4A5654] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
          >
            <option value="ALL">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          STAFF TABLE
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-[#FAF8F4] rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-[#B3261E] space-y-2">
            <AlertCircle size={20} className="mx-auto" />
            <div>Failed to load staff list: {error.message}</div>
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#7A8582] space-y-2">
            <Users2 size={24} className="mx-auto text-[#7A8582] opacity-40" />
            <div>No staff accounts found matching filters.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F4] text-[#7A8582] uppercase tracking-wider font-semibold border-b border-[#E7E3DA]">
                <tr>
                  <th scope="col" className="py-3.5 pl-6 pr-3">Name</th>
                  <th scope="col" className="py-3.5 px-3">Email</th>
                  <th scope="col" className="py-3.5 px-3">Role</th>
                  <th scope="col" className="py-3.5 px-3">Centre</th>
                  <th scope="col" className="py-3.5 px-3 text-center">Status</th>
                  <th scope="col" className="py-3.5 px-3">Last Login</th>
                  <th scope="col" className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]/60">
                {staffList.map((staff) => {
                  const isSelf = currentAdmin?._id === staff._id || currentAdmin?.id === staff._id
                  const isLastAdmin = staff.role === 'admin' && activeAdminCount <= 1 && staff.isActive !== false
                  const canDeactivate = !isSelf && !isLastAdmin

                  const deactDisabledReason = isSelf
                    ? 'You cannot deactivate your own account'
                    : isLastAdmin
                    ? 'Cannot deactivate the last active administrator'
                    : null

                  return (
                    <tr key={staff._id} className="hover:bg-[#FAF8F4] transition-colors">
                      {/* Name */}
                      <td className="py-3.5 pl-6 pr-3 font-semibold text-[#14211F]">
                        <div className="flex items-center gap-2">
                          <span>{staff.name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#FAF8F4] border border-[#E7E3DA] text-[#7A8582]">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-[#4A5654]">
                        {staff.email}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            staff.role === 'admin'
                              ? 'bg-[#E6F0EE] text-[#0E4D44]'
                              : 'bg-[#FAF8F4] text-[#4A5654] border border-[#E7E3DA]'
                          }`}
                        >
                          {staff.role === 'admin' ? 'Admin' : 'Accounts'}
                        </span>
                      </td>

                      {/* Centre */}
                      <td className="py-3.5 px-3 text-[#4A5654] font-medium">
                        {staff.centre}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            staff.isActive !== false
                              ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                              : 'bg-[#FDECEA] text-[#B3261E]'
                          }`}
                        >
                          {staff.isActive !== false ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{staff.isActive !== false ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-3 text-[#7A8582] tabular-nums text-[11px]">
                        {staff.lastLoginAt ? formatDate(staff.lastLoginAt, lang) : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => setEditingStaff(staff)}
                            className="p-1.5 rounded-lg border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-[#4A5654] transition-colors"
                            title="Edit Name & Centre"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => setConfirmResetStaff(staff)}
                            className="p-1.5 rounded-lg border border-[#E7E3DA] bg-white hover:border-[#D98A1E] hover:text-[#D98A1E] text-[#4A5654] transition-colors"
                            title="Generate Temporary Password"
                          >
                            <KeyRound size={13} />
                          </button>

                          {/* Deactivate / Reactivate button */}
                          <div className="relative group inline-block">
                            <button
                              type="button"
                              disabled={!canDeactivate}
                              onClick={() => setConfirmToggleActive(staff)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                !canDeactivate
                                  ? 'border-[#E7E3DA] text-[#7A8582]/40 cursor-not-allowed bg-[#FAF8F4]'
                                  : staff.isActive !== false
                                  ? 'border-[#E7E3DA] text-[#B3261E] hover:bg-[#FDECEA]'
                                  : 'border-[#E7E3DA] text-[#1F7A4D] hover:bg-[#E8F4EC]'
                              }`}
                              title={deactDisabledReason || (staff.isActive !== false ? 'Deactivate' : 'Reactivate')}
                            >
                              {staff.isActive !== false ? <Lock size={13} /> : <CheckCircle2 size={13} />}
                            </button>
                            {deactDisabledReason && (
                              <div className="hidden group-hover:block absolute right-0 bottom-full mb-1 w-48 p-1.5 bg-[#14211F] text-white text-[10px] rounded-lg shadow-lg z-50">
                                {deactDisabledReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          MODAL: ADD STAFF
         ────────────────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14211F]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E3DA]">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-[#0E4D44]" />
                <h3 className="font-serif font-bold text-lg text-[#14211F]">
                  {isHindi ? 'नया स्टाफ़ खाता जोड़ें' : 'Add Accounts Staff Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#4A5654] mb-1">
                  Full Name <span className="text-[#B3261E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A5654] mb-1">
                  Work Email <span className="text-[#B3261E]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.sharma@institute.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A5654] mb-1">
                  Centre Allocation <span className="text-[#B3261E]">*</span>
                </label>
                <select
                  value={createForm.centre}
                  onChange={(e) => setCreateForm({ ...createForm, centre: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                >
                  {CENTRES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-[11px] text-[#7A8582] space-y-1">
                <div>
                  Role is fixed to: <strong className="text-[#0E4D44]">Accounts Executive</strong>
                </div>
                <div>
                  A temporary password will be generated upon creation and shown only once.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:bg-[#FAF8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-9 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isCreating && <Loader2 size={13} className="animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: EDIT STAFF
         ────────────────────────────────────────────────────────── */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14211F]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E3DA]">
              <h3 className="font-serif font-bold text-lg text-[#14211F]">
                Edit Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#4A5654] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A5654] mb-1">Centre</label>
                <select
                  value={editingStaff.centre}
                  onChange={(e) => setEditingStaff({ ...editingStaff, centre: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                >
                  {CENTRES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:bg-[#FAF8F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="h-9 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isUpdating && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: CONFIRM DEACTIVATE / REACTIVATE
         ────────────────────────────────────────────────────────── */}
      {confirmToggleActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14211F]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-[#B3261E]">
              <AlertTriangle size={20} />
              <h3 className="font-serif font-bold text-lg text-[#14211F]">
                {confirmToggleActive.isActive !== false ? 'Deactivate Account' : 'Reactivate Account'}
              </h3>
            </div>
            <p className="text-xs text-[#4A5654] leading-relaxed">
              {confirmToggleActive.isActive !== false ? (
                <>
                  Are you sure you want to deactivate <strong className="text-[#14211F]">{confirmToggleActive.name}</strong> ({confirmToggleActive.email})? They will immediately be barred from signing into the staff portal.
                </>
              ) : (
                <>
                  Reactivate account for <strong className="text-[#14211F]">{confirmToggleActive.name}</strong>? They will be able to sign in with their existing credentials.
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
              <button
                type="button"
                onClick={() => setConfirmToggleActive(null)}
                className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isToggling}
                onClick={handleConfirmToggleActive}
                className={`h-9 px-4 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                  confirmToggleActive.isActive !== false
                    ? 'bg-[#B3261E] hover:bg-[#8F1E17]'
                    : 'bg-[#1F7A4D] hover:bg-[#18623D]'
                }`}
              >
                {isToggling && <Loader2 size={13} className="animate-spin" />}
                <span>{confirmToggleActive.isActive !== false ? 'Confirm Deactivation' : 'Confirm Reactivation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: CONFIRM PASSWORD RESET
         ────────────────────────────────────────────────────────── */}
      {confirmResetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14211F]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-[#D98A1E]">
              <KeyRound size={20} />
              <h3 className="font-serif font-bold text-lg text-[#14211F]">
                Reset Staff Password
              </h3>
            </div>
            <p className="text-xs text-[#4A5654] leading-relaxed">
              This will generate a new random temporary password for <strong className="text-[#14211F]">{confirmResetStaff.name}</strong> and require them to set a new password on their next login.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
              <button
                type="button"
                onClick={() => setConfirmResetStaff(null)}
                className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="h-9 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isResetting && <Loader2 size={13} className="animate-spin" />}
                <span>Generate New Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MODAL: ONE-TIME TEMPORARY PASSWORD DISPLAY BOX
         ────────────────────────────────────────────────────────── */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14211F]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center shrink-0">
                <KeyRound size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-bold text-lg text-[#14211F]">
                  {tempPasswordModal.title}
                </h3>
                <div className="text-xs text-[#7A8582] mt-0.5">
                  User: <strong className="text-[#14211F]">{tempPasswordModal.userName}</strong> ({tempPasswordModal.userEmail})
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="p-3 rounded-xl bg-[#FFF4E0] border border-[#D98A1E]/30 text-xs text-[#9A5B0B] flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Shown only once. Share it securely.</strong>
                <p className="text-[11px] mt-0.5 opacity-90">
                  This password is never stored in plain text and cannot be retrieved again. The user will be required to change it immediately upon signing in.
                </p>
              </div>
            </div>

            {/* Copyable Password Box */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-between gap-3">
              <code className="font-mono font-bold text-sm text-[#0E4D44] select-all tracking-wider">
                {tempPasswordModal.password}
              </code>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-[#E7E3DA] hover:border-[#0E4D44] text-[#0E4D44] text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                {copied ? <Check size={13} className="text-[#1F7A4D]" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#E7E3DA] flex justify-end">
              <button
                type="button"
                onClick={() => setTempPasswordModal(null)}
                className="h-9 px-5 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold shadow-xs"
              >
                I have securely saved this password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
