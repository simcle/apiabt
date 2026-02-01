import Device from '../models/Device.js'

export const generateDeviceId = async (tenantId) => {
  const lastDevice = await Device.findOne({ tenantId })
    .sort({ deviceId: -1 })
    .select('deviceId')
    .lean()

  // Kalau belum ada device
  if (!lastDevice || !lastDevice.deviceId) {
    return 'D01'
  }

  // Ambil angka setelah huruf D
  const match = lastDevice.deviceId.match(/^D(\d{2})$/)

  if (!match) {
    return 'D01'
  }

  const lastNumber = parseInt(match[1], 10)
  const nextNumber = lastNumber + 1

  // Batas aman (D99)
  if (nextNumber > 99) {
    throw new Error('Device limit reached (max D99 per tenant)')
  }

  return `D${String(nextNumber).padStart(2, '0')}`
}