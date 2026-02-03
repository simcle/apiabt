import { deviceMap } from '../cache/deviceCache.js'
import Device from '../models/Device.js'
import { sendDeviceStatusTelegram } from '../services/telegram.service.js'

export const checkOfflineDevices = async () => {
  const now = Date.now()

  for (const [key, device] of deviceMap.entries()) {
    if (!device.lastSeen || !device.periodic) continue

    const thresholdMs =
      device.periodic * 3 * 60 * 1000 // periodic × 3

    const offlineBefore = now - thresholdMs

    if (
      device.status === 'ONLINE' &&
      new Date(device.lastSeen).getTime() < offlineBefore
    ) {
      // update cache
      device.status = 'OFFLINE'

      // update DB async
      Device.updateOne(
        { tenantId: device.tenantId, deviceId: device.deviceId },
        { status: 'OFFLINE' }
      ).catch(() => {})

      // alert OFFLINE (sekali)
      sendDeviceStatusTelegram({
        tenantId: device.tenantId,
        device,
        status: 'OFFLINE',
        lastSeen: device.lastSeen
      }).catch(() => {})

      console.log(`🔴 Device OFFLINE: ${device.tenantId} ${device.deviceId}`)
    }
  }
}