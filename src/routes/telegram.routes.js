import express from 'express'
import { telegramWebhook } from '../controllers/telegram.controller.js'

const router = express.Router()

router.post('/telegram/webhook', telegramWebhook)

export default router