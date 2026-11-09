import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signToken(payload, expiresIn = env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn })
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET)
}

export function setAuthCookie(res, token) {
  const isCrossSite = env.NODE_ENV === 'production' || env.CLIENT_URL?.startsWith('https')
  res.cookie('token', token, {
    httpOnly: true,
    secure: isCrossSite,
    sameSite: isCrossSite ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  })
}

export function clearAuthCookie(res) {
  const isCrossSite = env.NODE_ENV === 'production' || env.CLIENT_URL?.startsWith('https')
  res.cookie('token', '', {
    httpOnly: true,
    secure: isCrossSite,
    sameSite: isCrossSite ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  })
}
