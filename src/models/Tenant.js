import mongoose from 'mongoose'

const tenantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    telegram: {
      chatId: {
        type: String,
        default: null
      },
      isActive: {
        type: Boolean,
        default: false
      },
      groupChatId: {
        type: String,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
)

const Tenant = mongoose.model('Tenant', tenantSchema)
export default Tenant