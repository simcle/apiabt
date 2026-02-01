import Tenant from '../models/Tenant.js'
import { generateTenantId } from '../utils/generateTenantId.js'
import { tenantMap } from '../cache/deviceCache.js'

// =======================
// Create Tenant
// =======================
export const createTenant = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name is required'
      })
    }

    const tenantId = await generateTenantId()

    const tenant = await Tenant.create({
      tenantId,
      name
    })

    return res.status(201).json({
      success: true,
      data: {
        tenantId: tenant.tenantId,
        name: tenant.name
      }
    })

  } catch (err) {
    console.error('Create tenant error:', err)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// =======================
// Get All Tenants
// =======================
export const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().select('tenantId name telegram.chatId createdAt')

    return res.json({
      success: true,
      data: tenants
    })
  } catch (err) {
    console.error('Get tenants error:', err)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// =======================
// Update Tenant
// =======================
export const updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params
    const { name } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name is required'
      })
    }

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      { name },
      { new: true }
    )

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      })
    }

    return res.json({
      success: true,
      data: {
        tenantId: tenant.tenantId,
        name: tenant.name
      }
    })

  } catch (err) {
    console.error('Update tenant error:', err)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// =======================
// Delete Tenant
// =======================
export const deleteTenant = async (req, res) => {
  try {
    const { tenantId } = req.params

    const tenant = await Tenant.findOneAndDelete({ tenantId })

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      })
    }

    return res.json({
      success: true,
      message: 'Tenant deleted'
    })

  } catch (err) {
    console.error('Delete tenant error:', err)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}

// =======================
// Update Telegram Tenant
// =======================
export const updateTenantTelegram = async (req, res) => {
  try {
    const { tenantId } = req.params
    const { botToken, chatId, isActive } = req.body

    // =========================
    // Validasi minimal
    // =========================
    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        message: 'botToken and chatId are required'
      })
    }

    // =========================
    // Update MongoDB
    // ⚠️ WAJIB select +botToken
    // =========================
    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      {
        telegram: {
          botToken,
          chatId,
          isActive: isActive !== undefined ? isActive : true
        }
      },
      { new: true }
    ).select('+telegram.botToken telegram.chatId telegram.isActive tenantId name')

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      })
    }

    // =========================
    // Update CACHE MEMORY
    // =========================
    tenantMap.set(tenantId, tenant.toObject())

    // =========================
    // Response (token TIDAK bocor)
    // =========================
    return res.json({
      success: true,
      data: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        telegram: {
          chatId: tenant.telegram.chatId,
          isActive: tenant.telegram.isActive
        }
      }
    })

  } catch (err) {
    console.error('Update tenant telegram error:', err)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}