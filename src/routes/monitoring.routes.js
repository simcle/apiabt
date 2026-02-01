import express from 'express'
import { getMonitoring } from '../controllers/monitoring.controller.js'

const router = express.Router()

router.get('/monitoring', getMonitoring)

export default router