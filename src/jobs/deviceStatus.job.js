import { deviceMap } from '../cache/deviceCache.js'
import Device from '../models/Device.js'
import { sendDeviceStatusTelegram } from '../services/telegram.service.js'

const OFFLINE_THRESHOLD_MINUTES = 10

export const checkOfflineDevices = async () => {
  const now = Date.now()
  const offlineBefore = new Date(
    now - OFFLINE_THRESHOLD_MINUTES * 60 * 1000
  )

  for (const [key, device] of deviceMap.entries()) {
    if (!device.lastSeen) continue

    if (
      device.status === 'ONLINE' &&
      device.lastSeen < offlineBefore
    ) {
      // update cache
      device.status = 'OFFLINE'

      // update DB async
      Device.updateOne(
        { tenantId: device.tenantId, deviceId: device.deviceId },
        { status: 'OFFLINE' }
      ).catch(() => {})

      // 🔔 Alert OFFLINE (sekali)
      sendDeviceStatusTelegram({
        tenantId: device.tenantId,
        device,
        status: 'OFFLINE',
        lastSeen: device.lastSeen
      }).catch(() => {})
      console.log(`🔴 Device OFFLINE: ${device.tenantId} ${device.deviceId}`)

      // TODO next:
      // sendTelegramOfflineAlert(device)
    }
  }
}