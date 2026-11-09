import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import { requireRole } from '../middleware/auth.js'
import { getSettings, updateStaff } from '../controllers/adminController.js'
import { changePassword } from '../controllers/authController.js'
import { REFUND_POLICY_CONFIG } from '../config/refundPolicy.js'
import { User } from '../models/User.js'

describe('Admin Module Unit Tests (Fast & Offline)', () => {
  describe('RBAC & Route Protection', () => {
    const adminCheck = requireRole('admin')

    it('denies access (403) to parents', () => {
      const req = { user: { role: 'parent' } }
      let error = null
      adminCheck(req, {}, (err) => { error = err })
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
    })

    it('denies access (403) to accounts staff', () => {
      const req = { user: { role: 'accounts' } }
      let error = null
      adminCheck(req, {}, (err) => { error = err })
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
    })

    it('allows access to admin users', () => {
      const req = { user: { role: 'admin' } }
      let passed = false
      adminCheck(req, {}, (err) => { if (!err) passed = true })
      expect(passed).toBe(true)
    })
  })

  describe('Read-Only Settings Controller', () => {
    it('returns frozen policy parameters matching code config', async () => {
      let responseData = null
      const res = {
        status: () => res,
        json: (payload) => { responseData = payload.data },
      }

      await getSettings({}, res, () => {})
      expect(responseData).toBeDefined()
      expect(responseData.notice).toContain('not editable')
      expect(responseData.refundPolicy.version).toBe(REFUND_POLICY_CONFIG.policyVersion)
      expect(responseData.taxation.gstRatePercent).toBe(18)
      expect(responseData.reminders.offsets.length).toBeGreaterThanOrEqual(4)
      expect(responseData.riskScoring.factors.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Self-Deactivation & Last Admin Protection Guards', () => {
    it('blocks admin from deactivating their own account', async () => {
      const req = {
        user: { id: 'admin_123', email: 'admin@feedesk.demo' },
        params: { id: 'admin_123' },
        body: { isActive: false },
      }

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: 'admin_123',
        role: 'admin',
        name: 'Admin',
      })

      let error = null
      await updateStaff(req, {}, (err) => { error = err })
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('SELF_DEACTIVATION_FORBIDDEN')

      User.findById.mockRestore()
    })

    it('blocks deactivating the last active admin', async () => {
      const req = {
        user: { id: 'admin_other', email: 'other@feedesk.demo' },
        params: { id: 'admin_target' },
        body: { isActive: false },
      }

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: 'admin_target',
        role: 'admin',
        name: 'Target Admin',
      })
      jest.spyOn(User, 'countDocuments').mockResolvedValue(1)

      let error = null
      await updateStaff(req, {}, (err) => { error = err })
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('LAST_ADMIN_PROTECTED')

      User.findById.mockRestore()
      User.countDocuments.mockRestore()
    })
  })

  describe('Password Change & Strength Validation', () => {
    it('rejects passwords shorter than 8 characters', async () => {
      const req = {
        user: { id: 'user_1' },
        body: { currentPassword: 'OldPassword1!', newPassword: 'short' },
      }
      let error = null
      await changePassword(req, {}, (err) => { error = err })
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('WEAK_PASSWORD')
    })

    it('rejects passwords without numbers or symbols', async () => {
      const req = {
        user: { id: 'user_1' },
        body: { currentPassword: 'OldPassword1!', newPassword: 'onlyletters' },
      }
      let error = null
      await changePassword(req, {}, (err) => { error = err })
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('WEAK_PASSWORD')
    })

    it('rejects new password identical to current password', async () => {
      const req = {
        user: { id: 'user_1' },
        body: { currentPassword: 'SamePassword1!', newPassword: 'SamePassword1!' },
      }
      let error = null
      await changePassword(req, {}, (err) => { error = err })
      expect(error).toBeDefined()
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('SAME_PASSWORD')
    })
  })
})
