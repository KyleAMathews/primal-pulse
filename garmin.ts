import { Client } from "pg"
import { v4 as uuidv4 } from "uuid"
const { GarminConnect } = require(`garmin-connect`)
const _ = require(`lodash`)
const { DATABASE_URL } = require(`./db/util.cjs`)
console.log({ DATABASE_URL })
const client = new Client({ connectionString: DATABASE_URL })

// Create a new Garmin Connect Client
const GCClient = new GarminConnect({
  username: `mathews.kyle@gmail.com`,
  password: process.env.GARMIN_PASSWORD,
})

async function main() {
  await client.connect()
  const res = await client.query(`SELECT $1::text as message`, [`Hello world!`])
  console.log(res.rows[0].message) // Hello world!
  // Uses credentials from garmin.config.json or uses supplied params
  await GCClient.login()
  //const userProfile = await GCClient.getUserProfile();
  //console.log(userProfile)
  const activities = await GCClient.getActivities(0, 3)
  // console.log(Object.keys(activities[0]))
  // console.log(
  // activities.map((activity) =>
  // _.pick(activity, [
  // `activityId`,
  // `activityName`,
  // `activityType.typeKey`,
  // `startTimeGMT`,
  // `distance`,
  // `duration`,
  // `elapsedDuration`,
  // `movingDuration`,
  // `averageHR`,
  // `steps`,
  // `avgPower`,
  // ])
  // )
  // )
  try {
    await Promise.all(
      activities.map(async (activity) => {
        const pickedActivity = _.pick(activity, [
          `activityId`,
          `activityName`,
          `activityType.typeKey`,
          `startTimeGMT`,
          `distance`,
          `duration`,
          `elapsedDuration`,
          `averageHR`,
          `steps`,
          `avgPower`,
        ])
        // Check if a record with the specified activityId exists
        const checkQuery = `SELECT id FROM garmin_data WHERE attributes->>'activityId' = $1`
        const checkResult = await client.query(checkQuery, [
          pickedActivity.activityId,
        ])

        let query
        let values

        if (checkResult.rows.length > 0) {
          console.log(`updating record`)
          // Record exists, so prepare an update query
          query = `
      UPDATE garmin_data
      SET date = $1, user_id = $2, attributes = $3
      WHERE attributes->>'activityId' = $4
    `
          values = [
            new Date(pickedActivity.startTimeGMT + ` GMT`),
            `user_2ZrWJQijcAkujdv4nQMOYaE1Obi`,
            JSON.stringify(activity),
            activity.activityId,
          ]
        } else {
          console.log(`creating record`)
          // Record does not exist, so prepare an insert query
          query = `
      INSERT INTO garmin_data (id, date, user_id, type, attributes)
      VALUES ($1, $2, $3, $4, $5)
    `
          values = [
            uuidv4(),
            new Date(pickedActivity.startTimeGMT + ` GMT`),
            `user_2ZrWJQijcAkujdv4nQMOYaE1Obi`,
            `activity`,
            JSON.stringify(activity),
          ]
        }

        // Execute the prepared query (insert or update)
        console.log({ query, values })
        try {
          await client.query(query, values)
        } catch (e) {
          console.log(e)
        }
        console.log(`done`)
      })
    )
  } catch (e) {
    console.log(e)
    throw e
  } finally {
    await client.end()
  }
}
main()
