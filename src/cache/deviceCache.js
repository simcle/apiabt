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

// ======================================================
// ADD TENANT TO CACHE (realtime)
// ======================================================
export const addTenantToCache = (tenant) => {
  if (!tenant || !tenant.tenantId) return

  tenantMap.set(tenant.tenantId, {
    tenantId: tenant.tenantId,
    name: tenant.name,
    telegram: tenant.telegram ?? {
      isActive: false
    }
  })
}


// ======================================================
// UPDATE TENANT TO CACHE (realtime)
// ======================================================
export const updateTenantInCache = (tenantId, updates) => {
  const tenant = tenantMap.get(tenantId)
  if (!tenant) return

  tenantMap.set(tenantId, {
    ...tenant,
    ...updates
  })

  console.log(`🧠 Tenant updated in cache: ${tenantId}`)
}


// ======================================================
// ADD DEVICE TO CACHE (realtime)
// ======================================================
export const addDeviceToCache = (device) => {
  if (!device || !device.deviceId || !device.tenantId) return

  const key = `${device.tenantId}:${device.deviceId}`

  deviceMap.set(key, {
    deviceId: device.deviceId,
    tenantId: device.tenantId,
    name: device.name,
    address: device.address ?? null,
    status: device.status ?? 'OFFLINE',
    lastSeen: device.lastSeen ?? null
  })

  console.log(`🧠 Device cached: ${key}`)
}

// ======================================================
// ADD DEVICE TO CACHE (realtime)
// ======================================================
export const updateDeviceInCache = (tenantId, deviceId, updates) => {
  const key = `${tenantId}:${deviceId}`
  const device = deviceMap.get(key)
  if (!device) return

  deviceMap.set(key, {
    ...device,
    ...updates
  })

  console.log(`🧠 Device updated in cache: ${key}`)
}