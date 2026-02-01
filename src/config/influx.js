import { InfluxDB } from '@influxdata/influxdb-client'

const {
  INFLUX_URL,
  INFLUX_TOKEN,
  INFLUX_ORG,
  INFLUX_BUCKET
} = process.env

const influx = new InfluxDB({
  url: INFLUX_URL,
  token: INFLUX_TOKEN
})

export const writeApi = influx.getWriteApi(
  INFLUX_ORG,
  INFLUX_BUCKET,
  'ms', // timestamp millisecond
  { 
    batchSize: 10,
    flushInterval: 1000
  }
)

export const queryApi = influx.getQueryApi(process.env.INFLUX_ORG)