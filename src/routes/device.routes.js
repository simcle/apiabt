import express from 'express'
import {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice
} from '../controllers/device.controller.js'

const router = express.Router()

router.post('/tenants/:tenantId/devices', createDevice)
router.get('/tenants/:tenantId/devices', getDevices)
router.get('/tenants/:tenantId/devices/:deviceId', getDeviceById)
router.put('/tenants/:tenantId/devices/:deviceId', updateDevice)
router.delete('/tenants/:tenantId/devices/:deviceId', deleteDevice)

export default router