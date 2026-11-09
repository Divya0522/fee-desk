import express from 'express'
import { getRefundPolicy } from '../controllers/refundController.js'

export const policyRouter = express.Router()

// Public endpoint: returns published refund policy and dynamic worked example
policyRouter.get('/refund', getRefundPolicy)
