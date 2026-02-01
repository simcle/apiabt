import { getTenantFromCache, deviceMap } from '../cache/deviceCache.js'
import { getDeviceHistory } from '../services/influx.service.js'

export const getMonitoring = async (req, res) => {
  try {
    const { tenantId, period = '24h' } = req.query

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'tenantId is required'
      })
    }

    // =========================
    // Validasi tenant (cache)
    // =========================
    const tenant = getTenantFromCache(tenantId)
    if (!tenant) {
      return res.status(403).json({ success: false })
    }

    // =========================
    // Ambil semua device tenant
    // =========================
    const devices = []
    for (const device of deviceMap.values()) {
      if (device.tenantId === tenantId) {
        devices.push(device)
      }
    }

    // =========================
    // Ambil history InfluxDB
    // =========================
    const result = []

    for (const device of devices) {
      const history = await getDeviceHistory({
        tenantId,
        deviceId: device.deviceId,
        period
      })

      result.push({
        deviceId: device.deviceId,
        name: device.name,
        status: device.status,
        lastSeen: device.lastSeen,
        address: device.address,
        location: device.location,
        history
      })
    }

    return res.json({
      success: true,
      data: result
    })

  } catch (err) {
    console.error('Monitoring error:', err)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}