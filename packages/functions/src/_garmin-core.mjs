import { v4 as uuidv4 } from "uuid"
import garminConnect from "garmin-connect"
const { GarminConnect } = garminConnect
import pg from "pg"
const { Client } = pg

export async function getUsers({ connectionString }) {
  const client = new Client({ connectionString })
  await client.connect()
  const users = await client.query(`SELECT id from users`)
  return users.rows
}

export async function main({ userId, numActivities, connectionString }) {
  console.log({ connectionString })
  const client = new Client({ connectionString })
  await client.connect()
  const res = await client.query(`SELECT $1::text as message`, [`Hello world!`])
  console.log(res.rows[0].message)
  const userInfo = await client.query(
    `SELECT garmin_username,
    garmin_password from users where id = $1`,
    [userId]
  )
  const garminInfo = userInfo.rows[0]
  console.log(garminInfo)

  // Create a new Garmin Connect Client
  const GCClient = new GarminConnect({
    username: garminInfo.garmin_username,
    password: garminInfo.garmin_password,
  })
  // Uses credentials from garmin.config.json or uses supplied params
  await GCClient.login()
  //const userProfile = await GCClient.getUserProfile();
  //console.log(userProfile)
  const activities = await GCClient.getActivities(0, numActivities)
  try {
    for (const activity of activities) {
      // Check if a record with the specified activityId exists
      const checkQuery = `SELECT id FROM garmin_data WHERE attributes->>'activityId' = $1`
      const checkResult = await client.query(checkQuery, [activity.activityId])

      let query
      let values

      if (checkResult.rows.length > 0) {
        console.log(`updating record`, new Date(activity.startTimeGMT + ` GMT`))
        // Record exists, so prepare an update query
        query = `
      UPDATE garmin_data
      SET date = $1, user_id = $2, attributes = $3
      WHERE attributes->>'activityId' = $4
    `
        values = [
          new Date(activity.startTimeGMT + ` GMT`),
          userId,
          JSON.stringify(activity),
          activity.activityId,
        ]
      } else {
        console.log(`creating record`, new Date(activity.startTimeGMT + ` GMT`))
        // Record does not exist, so prepare an insert query
        query = `
      INSERT INTO garmin_data (id, date, user_id, type, attributes)
      VALUES ($1, $2, $3, $4, $5)
    `
        values = [
          uuidv4(),
          new Date(activity.startTimeGMT + ` GMT`),
          userId,
          `activity`,
          JSON.stringify(activity),
        ]
      }

      // Execute the prepared query (insert or update)
      try {
        await client.query(query, values)
      } catch (e) {
        // console.log(e)
      }
      // console.log(`done`)
    }
  } catch (e) {
    console.log(e)
    throw e
  } finally {
    await client.end()
  }
}
