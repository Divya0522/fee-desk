import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1).default(() => process.env.MONGO_URI || 'mongodb://localhost:27017/feedesk'),
  JWT_SECRET: z.string().min(8).default('feedesk_dev_jwt_secret_key_12345_super_safe'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DEMO_OTP: z.string().default('123456'),
  PAYMENT_WEBHOOK_SECRET: z.string().default('feedesk_mock_webhook_hmac_secret_key'),
  GST_RATE_PERCENT: z.coerce.number().default(18),
  STRIPE_SECRET_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  CLIENT_URL: process.env.CLIENT_URL,
  DEMO_OTP: process.env.DEMO_OTP,
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
  GST_RATE_PERCENT: process.env.GST_RATE_PERCENT,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
})

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format())
  throw new Error('Environment configuration validation failed')
}

export const env = parsed.data
