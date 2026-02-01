import axios from 'axios'
import { getTenantFromCache } from '../cache/deviceCache.js'

// ======================================================
// Helper: kirim message ke Telegram
// ======================================================
const sendMessage = async (token, chatId, message) => {
  await axios.post(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    }
  )
}

export const sendTelemetryToTelegram = async ({
  tenantId,
  device,
  waterLevel,
  rssi
}) => {
  try {
    // =========================
    // Ambil tenant dari memory
    // =========================
    const tenant = getTenantFromCache(tenantId)
    if (!tenant?.telegram?.isActive) return
    const token = tenant.telegram.botToken
    const chatId = tenant.telegram.chatId
    if (!token || !chatId) return
    const message = `
📡 *Telemetry Update*
🏷 Tenant: ${tenant.name}
📍 Device: ${device.name} (${device.deviceId})
💧 Level Air: *${waterLevel} m*
📶 RSSI: ${rssi ?? '-'}
🕒 ${new Date().toLocaleString('id-ID')}
    `
    await sendMessage(token, chatId, message)

  } catch (err) {
    console.error('❌ Telegram send error:', err.message)
  }
}

// ======================================================
// DEVICE OFFLINE / ONLINE ALERT
// ======================================================
export const sendDeviceStatusTelegram = async ({
  tenantId,
  device,
  status,
  lastSeen
}) => {
  try {
    const tenant = getTenantFromCache(tenantId)
    if (!tenant?.telegram?.isActive) return

    const { botToken, chatId } = tenant.telegram
    if (!botToken || !chatId) return

    const timeStr = lastSeen
      ? new Date(lastSeen).toLocaleString('id-ID')
      : '-'

    let message = ''

    if (status === 'OFFLINE') {
      message = `
🔴 *DEVICE OFFLINE*
🏷 Tenant: ${tenant.name}
📍 Device: ${device.name} (${device.deviceId})
📌 ${device.address ?? '-'}
🕒 Terakhir aktif: ${timeStr}
      `
    }

    if (status === 'ONLINE') {
      message = `
🟢 *DEVICE ONLINE*
🏷 Tenant: ${tenant.name}
📍 Device: ${device.name} (${device.deviceId})
📌 ${device.address ?? '-'}
🕒 Aktif kembali: ${new Date().toLocaleString('id-ID')}
      `
    }

    if (!message) return

    await sendMessage(botToken, chatId, message)

  } catch (err) {
    console.error('❌ Telegram status error:', err.message)
  }
}