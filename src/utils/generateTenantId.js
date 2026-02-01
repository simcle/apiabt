import Tenant from '../models/Tenant.js'

export const generateTenantId = async () => {
  const lastTenant = await Tenant
    .findOne({})
    .sort({ tenantId: -1 })
    .select('tenantId')

  if (!lastTenant || !lastTenant.tenantId) {
    return '001'
  }

  const next = parseInt(lastTenant.tenantId, 10) + 1
  return String(next).padStart(3, '0')
}