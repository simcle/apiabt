import express from 'express'
import cors from 'cors'
import connectDB from './src/config/mongo.js'
import { loadCache } from './src/cache/deviceCache.js'
import { checkOfflineDevices } from './src/jobs/deviceStatus.job.js'

import tenantRoutes  from './src/routes/tenant.routes.js'
import deviceRoutes from './src/routes/device.routes.js'
import telemetryRoutes from './src/routes/telemetry.routes.js'
import monitoringRoutes from './src/routes/monitoring.routes.js'


const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/v1', tenantRoutes)
app.use('/api/v1', deviceRoutes)
app.use('/api/v1', telemetryRoutes)
app.use('/api/v1/', monitoringRoutes)
app.get('/api/telemtry', (req, res) => {
    res.status(200).json('OK')
})


await connectDB()
await loadCache()

setInterval(loadCache, 10 * 60 * 1000)
setInterval(checkOfflineDevices, 60 * 1000)
const PORT = 4000

app.listen(PORT, () => {
    console.log('server listen on PORT: '+PORT)
})