import { describe, it, expect } from 'vitest'

describe('Admin Module Frontend Logic & Form Validations', () => {
  describe('Staff Creation Form Validation', () => {
    function validateStaffInput({ name, email, role, centre }) {
      const errors = {}
      if (!name || name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters'
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Valid work email required'
      }
      if (role !== 'accounts') {
        errors.role = 'Role must be Accounts executive'
      }
      if (!centre || centre.trim().length === 0) {
        errors.centre = 'Centre allocation is required'
      }
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      }
    }

    it('validates correct accounts executive staff payload', () => {
      const result = validateStaffInput({
        name: 'Kavita Mathur',
        email: 'kavita@feedesk.demo',
        role: 'accounts',
        centre: 'Jaipur Main',
      })
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('rejects empty or single character names', () => {
      const result = validateStaffInput({
        name: 'K',
        email: 'kavita@feedesk.demo',
        role: 'accounts',
        centre: 'Jaipur Main',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('rejects invalid email formats', () => {
      const result = validateStaffInput({
        name: 'Kavita Mathur',
        email: 'kavita-at-feedesk',
        role: 'accounts',
        centre: 'Jaipur Main',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })

    it('disallows creating admin role through standard staff form', () => {
      const result = validateStaffInput({
        name: 'Rohan Sharma',
        email: 'rohan@feedesk.demo',
        role: 'admin',
        centre: 'ALL',
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.role).toBeDefined()
    })
  })

  describe('One-Time Temporary Password Display Box', () => {
    function formatTempPasswordNotice({ tempPassword, userName }) {
      return {
        password: tempPassword,
        user: userName,
        warning: 'Shown only once. Share it securely.',
        canCopy: Boolean(tempPassword && tempPassword.length >= 12),
      }
    }

    it('prepares copyable one-time password notice with statutory security warning', () => {
      const notice = formatTempPasswordNotice({
        tempPassword: 'FD-X9#mK2@pL4!q',
        userName: 'Suresh Kumar',
      })

      expect(notice.canCopy).toBe(true)
      expect(notice.password).toBe('FD-X9#mK2@pL4!q')
      expect(notice.warning).toContain('Shown only once')
    })
  })

  describe('Self-Deactivation & Last Admin UI Guard Rules', () => {
    function getDeactivationState({ currentUserId, targetUser, activeAdminCount }) {
      const isSelf = currentUserId === targetUser.id
      const isLastAdmin = targetUser.role === 'admin' && activeAdminCount <= 1 && targetUser.isActive !== false

      if (isSelf) {
        return {
          canDeactivate: false,
          reason: 'You cannot deactivate your own account',
        }
      }

      if (isLastAdmin) {
        return {
          canDeactivate: false,
          reason: 'Cannot deactivate the last active administrator',
        }
      }

      return {
        canDeactivate: true,
        reason: null,
      }
    }

    it('blocks self deactivation with clear reason', () => {
      const state = getDeactivationState({
        currentUserId: 'admin_1',
        targetUser: { id: 'admin_1', role: 'admin', isActive: true },
        activeAdminCount: 3,
      })
      expect(state.canDeactivate).toBe(false)
      expect(state.reason).toBe('You cannot deactivate your own account')
    })

    it('blocks deactivating the last active admin', () => {
      const state = getDeactivationState({
        currentUserId: 'admin_1',
        targetUser: { id: 'admin_2', role: 'admin', isActive: true },
        activeAdminCount: 1, // Only 1 active admin remains
      })
      expect(state.canDeactivate).toBe(false)
      expect(state.reason).toBe('Cannot deactivate the last active administrator')
    })

    it('allows deactivating non-admin staff member', () => {
      const state = getDeactivationState({
        currentUserId: 'admin_1',
        targetUser: { id: 'accounts_99', role: 'accounts', isActive: true },
        activeAdminCount: 1,
      })
      expect(state.canDeactivate).toBe(true)
      expect(state.reason).toBeNull()
    })
  })

  describe('Password Change Strength Rules', () => {
    function validateNewPassword(current, next, confirm) {
      const hasLength = next.length >= 8
      const hasLetter = /[A-Za-z]/.test(next)
      const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(next)
      const matchesConfirm = next === confirm
      const isDifferent = next !== current

      return {
        isValid: hasLength && hasLetter && hasNumberOrSymbol && matchesConfirm && isDifferent,
        hasLength,
        hasLetter,
        hasNumberOrSymbol,
        matchesConfirm,
        isDifferent,
      }
    }

    it('validates a strong new password matching confirm and differing from current', () => {
      const res = validateNewPassword('TempPass123!', 'NewPass2026@', 'NewPass2026@')
      expect(res.isValid).toBe(true)
    })

    it('rejects if new password is same as temporary current password', () => {
      const res = validateNewPassword('TempPass123!', 'TempPass123!', 'TempPass123!')
      expect(res.isValid).toBe(false)
      expect(res.isDifferent).toBe(false)
    })

    it('rejects if confirm password does not match', () => {
      const res = validateNewPassword('TempPass123!', 'NewPass2026@', 'WrongConfirm')
      expect(res.isValid).toBe(false)
      expect(res.matchesConfirm).toBe(false)
    })
  })
})
