import axios from 'axios'
import { getTenantFromCache } from '../cache/deviceCache.js'

const token = process.env.TELEGRAM_BOT_TOKEN
// ======================================================
// Helper: kirim message ke Telegram
// ======================================================
const sendMessage = async (chatId, message) => {
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
    const { chatId, groupChatId } = tenant.telegram
    // Prioritas kirim ke group jika ada
    const targetChatId = groupChatId || chatId
    if (!targetChatId) return
    const message = `
📡 *Telemetry Update*
🏷 Tenant: ${tenant.name}
📍 Device: ${device.name} (${device.deviceId})
💧 Level Air: *${waterLevel} m*
📶 RSSI: ${rssi ?? '-'}
🕒 ${new Date().toLocaleString('id-ID')}
    `
    await sendMessage(targetChatId, message)

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

    const { chatId, groupChatId } = tenant.telegram

    // Prioritas: group → private
    const targetChatId = groupChatId || chatId
    if (!targetChatId) return

    const timeStr = lastSeen
      ? new Date(lastSeen).toLocaleString('id-ID')
      : '-'

    let message = ''

    if (status === 'OFFLINE') {
      message = `
🔴 *DEVICE OFFLINE*
🏷 Tenant: ${tenant.name}
📍 Device: ${device.name} (${device.deviceId})
🕒 Terakhir aktif: ${timeStr}
      `
    }

    if (status === 'ONLINE') {
      message = `
🟢 *DEVICE ONLINE*
🏷 Tenant: ${tenant.name}
📍 Device: ${device.name} (${device.deviceId})
🕒 Aktif kembali: ${new Date().toLocaleString('id-ID')}
      `
    }

    if (!message) return

    await sendMessage(targetChatId, message)

  } catch (err) {
    console.error('❌ Telegram status error:', err.message)
  }
}