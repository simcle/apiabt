import express from 'express'
import { createTenant, deleteTenant, getTenants, updateTenant, updateTenantTelegram } from '../controllers/tenant.controller.js'

const router = express.Router()

router.post('/tenants', createTenant)
router.get('/tenants', getTenants)
router.put('/tenants/:tenantId', updateTenant)
router.delete('/tenants/:tenantId', deleteTenant)
router.put('/tenants/:tenantId/telegram', updateTenantTelegram)

export default router