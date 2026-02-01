import { Point } from '@influxdata/influxdb-client'
import { writeApi, queryApi } from '../config/influx.js'

// ======================================================
// WRITE TELEMETRY (AMAN, SUDAH BENAR)
// ======================================================
export const writeTelemetryToInflux = ({
  tenantId,
  deviceId,
  waterLevel,
  rssi,
  timestamp
}) => {
  try {
    const point = new Point('water_level')
      .tag('tenantId', tenantId)
      .tag('deviceId', deviceId)
      .floatField('wl', waterLevel)

    if (rssi !== null) {
      point.intField('rssi', rssi)
    }

    point.timestamp(timestamp)

    writeApi.writePoint(point)
  } catch (err) {
    console.error('❌ Influx write error:', err)
  }
}

// ======================================================
// QUERY HISTORY (FIX STREAMING)
// ======================================================
export const getDeviceHistory = ({
  tenantId,
  deviceId,
  period = '1h'
}) => {
  const fluxQuery = `
from(bucket: "${process.env.INFLUX_BUCKET}")
  |> range(start: -${period})
  |> filter(fn: (r) =>
    r._measurement == "water_level" and
    r.tenantId == "${tenantId}" and
    r.deviceId == "${deviceId}"
  )
  |> pivot(
    rowKey:["_time"],
    columnKey: ["_field"],
    valueColumn: "_value"
  )
  |> sort(columns: ["_time"])
`

  const rows = []

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row)
        rows.push({
          time: o._time,
          wl: o.wl ?? null,
          rssi: o.rssi ?? null
        })
      },

      error(error) {
        reject(error)
      },

      complete() {
        resolve(rows)   // ⬅️ INI KUNCI UTAMA
      }
    })
  })
}