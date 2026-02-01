import Tenant from '../models/Tenant.js'
import Device from '../models/Device.js'

export const tenantMap = new Map()
export const deviceMap = new Map()

export const loadCache = async () => {
  tenantMap.clear()
  deviceMap.clear()

  const tenants = await Tenant.find()
    .select('+telegram.botToken telegram.chatId telegram.isActive tenantId name')
    .lean()
  for (const t of tenants) {
    tenantMap.set(t.tenantId, t)
  }

  const devices = await Device.find().lean()
  for (const d of devices) {
    deviceMap.set(`${d.tenantId}:${d.deviceId}`, d)
  }

  console.log(
    `🧠 Cache loaded | tenants=${tenantMap.size}, devices=${deviceMap.size}`
  )
}

export const getTenantFromCache = (tenantId) => {
  return tenantMap.get(tenantId) || null
}

export const getDeviceFromCache = (tenantId, deviceId) => {
  return deviceMap.get(`${tenantId}:${deviceId}`) || null
}

export const updateDeviceLastSeen = (tenantId, deviceId, lastSeen) => {
  const key = `${tenantId}:${deviceId}`
  const device = deviceMap.get(key)
  if (device) device.lastSeen = lastSeen
}