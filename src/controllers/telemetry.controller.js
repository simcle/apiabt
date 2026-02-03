import { getTenantFromCache, getDeviceFromCache, updateDeviceLastSeen } from "../cache/deviceCache.js"
import { writeTelemetryToInflux } from "../services/influx.service.js"
import { sendTelemetryToTelegram, sendDeviceStatusTelegram } from "../services/telegram.service.js"
import Device from "../models/Device.js"

export const ingestTelemetry = async (req, res) => {
    try {
        
        const {tenantId, deviceId, wl, rssi} = req.query
        
        // =========================
        // Validasi minimal
        // =========================
        if (!tenantId || !deviceId || !wl) {
          return res.status(400).json({ ok: 0 })
        }
    
        // =========================
        // Validasi via cache
        // =========================
        const tenant = getTenantFromCache(tenantId)
        if (!tenant) return res.status(403).json({ ok: 0 })
    
        const device = getDeviceFromCache(tenantId, deviceId)
        if (!device) {
          return res.status(403).json({ ok: 0 })
        }
    
        const waterLevel = parseFloat(wl)
        if (Number.isNaN(waterLevel)) {
          return res.status(400).json({ ok: 0 })
        }
    
        const signal = rssi ? parseInt(rssi, 10) : null
        const now = new Date()

        // simpan ke influxDB
        writeTelemetryToInflux({
            tenantId,
            deviceId,
            waterLevel,
            rssi: signal,
            timestamp: now
        })

        // kirim ke telegram
        sendTelemetryToTelegram({
          tenantId,
          device,
          waterLevel,
          rssi: signal
        })

        const wasOffline = device.status === 'OFFLINE'
        updateDeviceLastSeen(tenantId, deviceId, now)
        device.status = 'ONLINE'

        Device.updateOne(
          {tenantId, deviceId},
          {lastSeen: now, status: 'ONLINE'}
        ).catch(() => {})

        // 🔔 Alert ONLINE (hanya sekali)
        if (wasOffline) {
          sendDeviceStatusTelegram({
            tenantId,
            device,
            status: 'ONLINE',
            lastSeen: now
          }).catch(() => {})
        }
        const interval = device?.periodic || 15
        return res.status(200).send({periodic: interval})

    } catch (error) {
        console.error('❌ ingestTelemetry error:', err)
        return res.status(500).json({ ok: 0 })
    }

}