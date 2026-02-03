import mongoose from 'mongoose'

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true
    },

    tenantId: {
      type: String,
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },
    // ⬇️ interval kirim data (menit)
    periodic: {
      type: Number,
      default: 15,
      min: 15,
      max: 60
    },
    // ======================
    // Koordinat (untuk map)
    // ======================
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },

    // ======================
    // Alamat (administratif)
    // ======================
    address: {
      type: String,
      default: null,
      trim: true
    },

    // ======================
    // Status & Monitoring
    // ======================
    isActive: {
      type: Boolean,
      default: true
    },
    // ======================
    // ONLINE / OFFLINE STATUS
    // ======================
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE'],
      default: 'OFFLINE'
    },

    lastSeen: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// Unik per tenant
deviceSchema.index({ tenantId: 1, deviceId: 1 }, { unique: true })

const Device = mongoose.model('Device', deviceSchema)
export default Device