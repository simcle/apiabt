import Device from '../models/Device.js'
import Tenant from '../models/Tenant.js'
import { generateDeviceId } from '../utils/generateDeviceId.js'
import { deviceMap } from '../cache/deviceCache.js'

// =======================
// Create Device
// =======================
export const createDevice = async (req, res) => {
  try {
    const { tenantId } = req.params
    const { name, lat, lng, address } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name is required'
      })
    }

    // pastikan tenant ada
    const tenant = await Tenant.findOne({ tenantId })
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      })
    }

    const deviceId = await generateDeviceId(tenantId)

    const device = await Device.create({
      tenantId,
      deviceId,
      name,
      location: {
        lat: lat ?? null,
        lng: lng ?? null,
        address: address ?? null
      }
    })
    deviceMap.set(`${tenantId}:${deviceId}`, device)
    return res.status(201).json({
      success: true,
      data: {
        tenantId: device.tenantId,
        deviceId: device.deviceId,
        name: device.name
      }
    })

  } catch (err) {
    console.error('Create device error:', err)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// =======================
// Get Devices by Tenant
// =======================
export const getDevices = async (req, res) => {
  try {
    const { tenantId } = req.params

    const devices = await Device.find({ tenantId })
      .sort({ deviceId: 1 })
      .select('tenantId deviceId name location isActive lastSeen createdAt')

    return res.json({
      success: true,
      data: devices
    })
  } catch (err) {
    console.error('Get devices error:', err)
    return res.status(500).json({
      success: false
    })
  }
}

// =======================
// Get Device Detail
// =======================
export const getDeviceById = async (req, res) => {
  try {
    const { tenantId, deviceId } = req.params

    const device = await Device.findOne({ tenantId, deviceId })
      .select('tenantId deviceId name location isActive lastSeen createdAt')

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      })
    }

    return res.json({
      success: true,
      data: device
    })
  } catch (err) {
    console.error('Get device error:', err)
    return res.status(500).json({
      success: false
    })
  }
}

// =======================
// Update Device
// =======================
export const updateDevice = async (req, res) => {
  try {
    const { tenantId, deviceId } = req.params
    const { name, lat, lng, address, isActive } = req.body

    const update = {}

    if (name !== undefined) update.name = name
    if (isActive !== undefined) update.isActive = isActive

    if (lat !== undefined || lng !== undefined || address !== undefined) {
      update.location = {}
      if (lat !== undefined) update.location.lat = lat
      if (lng !== undefined) update.location.lng = lng
    }

    if (address !== undefined) {
      update.address = address
    }

    const device = await Device.findOneAndUpdate(
      { tenantId, deviceId },
      update,
      { new: true }
    ).select('tenantId deviceId name location isActive lastSeen')

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      })
    }
    deviceMap.set(`${tenantId}:${deviceId}`, device)
    return res.json({
      success: true,
      data: device
    })

  } catch (err) {
    console.error('Update device error:', err)
    return res.status(500).json({
      success: false
    })
  }
}

// =======================
// Delete Device
// =======================
export const deleteDevice = async (req, res) => {
  try {
    const { tenantId, deviceId } = req.params

    const device = await Device.findOneAndDelete({ tenantId, deviceId })

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      })
    }
    deviceMap.delete(`${tenantId}:${deviceId}`)
    return res.json({
      success: true,
      message: 'Device deleted'
    })
  } catch (err) {
    console.error('Delete device error:', err)
    return res.status(500).json({
      success: false
    })
  }
}