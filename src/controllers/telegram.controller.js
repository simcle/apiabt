import Tenant from "../models/Tenant.js"
import Device from "../models/Device.js"
import { addTenantToCache, updateTenantInCache, addDeviceToCache, updateDeviceInCache, getDevicesByTenantFromCache } from "../cache/deviceCache.js"
import axios from "axios"
export const telegramWebhook = async (req, res) => {
    try {
        const msg = req.body.message
        
        if(!msg?.text) return res.sendStatus(200);

        const chatId = msg.chat.id
        const text = msg.text.trim()

        // ======================
        // /start
        // ======================
        if (text === '/start') {
            await sendMessage(chatId,
                `Halo 👋\n\nUntuk mendaftar tenant:\n/reg NAMA_TENANT`
            )
            return res.sendStatus(200)
        }

        // ======================
        // /register
        // ======================
        if(text.startsWith('/reg')) {
            const parts = text.trim().split(/\s+/)
            if (parts.length < 2) {
                await sendMessage(
                    chatId,
                    'Format salah.\nGunakan:\n/reg NAMA_TENANT atau /reg NAMA TENANT'
                )
                return res.sendStatus(200)
            }
            const tenantName = parts
                .slice(1)
                .join(' ')
                .replace(/_/g, ' ')
                .trim()
            console.log(tenantName)
            // cek apakah chatId sudah terdaftar
            const exists = await Tenant.findOne({ 'telegram.chatId': chatId })
            if (exists) {
                await sendMessage(chatId,
                `⚠️ Chat ini sudah terdaftar sebagai tenant ${exists.name}`
                )
                return res.sendStatus(200)
            }
            // generate tenantId (3 digit)
            const count = await Tenant.countDocuments()
            const tenantId = String(count + 1).padStart(3, '0')
    
            const tenant = await Tenant.create({
                tenantId,
                name: tenantName,
                telegram: {
                chatId,
                isActive: true
                }
            })
    
            await sendMessage(chatId,
                `✅ *Pendaftaran berhasil!*\n\n` +
                `Tenant ID : *${tenantId}*\n` +
                `Nama      : *${tenantName}*\n\n` +
                `Gunakan Tenant ID ini untuk device.`
            )
            // update cache
            addTenantToCache(tenant)
        }

        // ======================
        // /rename_tenant
        // ======================
        if (text.startsWith('/rename_tenant')) {
            const parts = text.trim().split(/\s+/)

            if (parts.length < 2) {
                await sendMessage(
                chatId,
                'Format salah.\nGunakan:\n/update_tenant NAMA_TENANT_BARU'
                )
                return res.sendStatus(200)
            }

            const newTenantName = parts
                .slice(1)
                .join(' ')
                .replace(/_/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            // Cari tenant berdasarkan chatId
            const tenant = await Tenant.findOne({ 'telegram.chatId': chatId })
            if (!tenant) {
                await sendMessage(
                chatId,
                '❌ Tenant tidak ditemukan. Silakan /reg terlebih dahulu.'
                )
                return res.sendStatus(200)
            }

            tenant.name = newTenantName
            await tenant.save()

            // Update cache
            updateTenantInCache(tenant.tenantId, {
                name: newTenantName
            })

            await sendMessage(
                chatId,
                `✅ Nama tenant berhasil diperbarui.\n\nNama baru:\n${newTenantName}`
            )

            return res.sendStatus(200)
        }

        // ======================
        // /add_device
        // ======================
        if (text.startsWith('/add_device')) {
            const parts = text.trim().split(/\s+/)

            if (parts.length < 2) {
                await sendMessage(
                chatId,
                'Format salah.\nGunakan:\n/add_device NAMA_DEVICE'
                )
                return res.sendStatus(200)
            }

            // ambil nama device (support spasi)
            const deviceName = parts
                .slice(1)
                .join(' ')
                .replace(/_/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            // cari tenant dari chatId
            const tenant = await Tenant.findOne({ 'telegram.chatId': chatId })
            if (!tenant) {
                await sendMessage(
                chatId,
                '❌ Tenant belum terdaftar.\nGunakan /reg terlebih dahulu.'
                )
                return res.sendStatus(200)
            }

            // hitung jumlah device tenant ini
            const count = await Device.countDocuments({ tenantId: tenant.tenantId })

            // generate deviceId: D01, D02, ...
            const deviceId = `D${String(count + 1).padStart(2, '0')}`

            try {
                const device = await Device.create({
                    tenantId: tenant.tenantId,
                    deviceId,
                    name: deviceName,
                    status: 'OFFLINE'
                })

                // update cache
                addDeviceToCache(device)
    
                await sendMessage(
                    chatId,
                    `✅ *Device berhasil ditambahkan*\n\n` +
                    `Tenant   : ${tenant.name}\n` +
                    `DeviceID : ${deviceId}\n` +
                    `Nama     : ${deviceName}\n\n` +
                    `Device siap menerima data.`
                )
    
                return res.sendStatus(200)
                
            } catch (error) {
                if (err.code === 11000) {
                    await sendMessage(
                    chatId,
                    '❌ Gagal menambahkan device.\nCoba ulangi perintah.'
                    )
                } else {
                    throw err
                }
            }

        }
        // ======================
        // /rename_device
        // ======================
        if (text.startsWith('/rename_device')) {
            const parts = text.trim().split(/\s+/)

            if (parts.length < 3) {
                await sendMessage(
                chatId,
                'Format salah.\nGunakan:\n/rename_device DEVICE_ID NAMA_BARU'
                )
                return res.sendStatus(200)
            }

            const deviceId = parts[1].toUpperCase()

            const newDeviceName = parts
                .slice(2)
                .join(' ')
                .replace(/_/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()

            // cari tenant dari chatId
            const tenant = await Tenant.findOne({ 'telegram.chatId': chatId })
            if (!tenant) {
                await sendMessage(
                chatId,
                '❌ Tenant tidak ditemukan.\nGunakan /reg terlebih dahulu.'
                )
                return res.sendStatus(200)
            }

            // cari device milik tenant
            const device = await Device.findOne({
                tenantId: tenant.tenantId,
                deviceId
            })

            if (!device) {
                await sendMessage(
                chatId,
                `❌ Device ${deviceId} tidak ditemukan.`
                )
                return res.sendStatus(200)
            }

            device.name = newDeviceName
            await device.save()

            // update cache
            updateDeviceInCache(tenant.tenantId, deviceId, {
                name: newDeviceName
            })

            await sendMessage(
                chatId,
                `✅ *Device berhasil di-rename*\n\n` +
                `DeviceID : ${deviceId}\n` +
                `Nama baru: ${newDeviceName}`
            )

            return res.sendStatus(200)
        }

        // ======================
        // /set_periodic
        // ======================
        if (text.startsWith('/set_periodic')) {
            const parts = text.trim().split(/\s+/)

            if (parts.length !== 3) {
                await sendMessage(
                chatId,
                'Format salah.\nGunakan:\n/set_periodic DEVICE_ID MENIT\nContoh: /set_periodic D01 30'
                )
                return res.sendStatus(200)
            }

            const deviceId = parts[1].toUpperCase()
            const minutes = parseInt(parts[2], 10)

            // validasi menit
            if (Number.isNaN(minutes) || minutes < 15 || minutes > 60) {
                await sendMessage(
                chatId,
                '❌ Interval tidak valid.\nGunakan nilai 15 – 60 menit.'
                )
                return res.sendStatus(200)
            }

            // cari tenant dari chatId
            const tenant = await Tenant.findOne({ 'telegram.chatId': chatId })
            if (!tenant) {
                await sendMessage(
                chatId,
                '❌ Tenant tidak ditemukan.'
                )
                return res.sendStatus(200)
            }

            // cari device
            const device = await Device.findOne({
                tenantId: tenant.tenantId,
                deviceId
            })

            if (!device) {
                await sendMessage(
                chatId,
                `❌ Device ${deviceId} tidak ditemukan.`
                )
                return res.sendStatus(200)
            }

            // update DB
            device.periodic = minutes
            await device.save()

            // update cache
            updateDeviceInCache(tenant.tenantId, deviceId, {
                periodic: minutes
            })

            await sendMessage(
                chatId,
                `⏱ *Periodic device diperbarui*\n\n` +
                `DeviceID : ${deviceId}\n` +
                `Interval : ${minutes} menit`
            )

            return res.sendStatus(200)
        }

        // ======================
        // /list_device
        // ======================
        if (text === '/list_device') {

            // cari tenant dari chatId
            const tenant = await Tenant.findOne({ 'telegram.chatId': chatId })
            if (!tenant) {
                await sendMessage(
                chatId,
                '❌ Tenant tidak ditemukan.\nGunakan /reg terlebih dahulu.'
                )
                return res.sendStatus(200)
            }

            // ambil device dari cache
            const devices = getDevicesByTenantFromCache(tenant.tenantId)

            if (!devices.length) {
                await sendMessage(
                chatId,
                '📭 Belum ada device terdaftar.\nGunakan /add_device untuk menambahkan.'
                )
                return res.sendStatus(200)
            }

            let message = `📋 Daftar Device\n`
            message += `Tenant ID : ${tenant.tenantId}\n`
            message += `Tenant: ${tenant.name}\n\n`

            devices.forEach((d, i) => {
                message +=
                `${i + 1}. ${d.deviceId}\n` +
                `   Nama   : ${d.name}\n` +
                `   Status : ${d.status ?? 'OFFLINE'}\n` +
                `   Last   : ${d.lastSeen ? new Date(d.lastSeen).toLocaleString('id-ID') : '-'}\n\n`
            })

            await sendMessage(chatId, message)

            return res.sendStatus(200)
        }

        return res.sendStatus(200)

    } catch (err) {
        console.error('Telegram webhook error:', err)
        return res.sendStatus(200)
    }



}

// helper kirim telegram
const sendMessage = async (chatId, text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  await axios.post(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      chat_id: chatId,
      text
    }
  )
}