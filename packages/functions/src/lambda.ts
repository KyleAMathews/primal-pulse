import { ApiHandler } from "sst/node/api"
import { main, getUsers } from "./_garmin-core.mjs"
import { Config } from "sst/node/config"

export const handler = ApiHandler(async (_evt) => {
  // If a user isn't set, just refresh everyone.
  if (!_evt.queryStringParameters?.userId) {
    const users = await getUsers({
      connectionString: Config.CONNECTION_STRING,
    })
    console.log({ users })
    for (const { id } of users) {
      await main({
        userId: id,
        numActivities: 5,
        connectionString: Config.CONNECTION_STRING,
      })
    }
  } else {
    await main({
      userId: _evt.queryStringParameters.userId,
      numActivities: _evt.queryStringParameters.numActivities || 5,
      connectionString: Config.CONNECTION_STRING,
    })
  }
  return {
    statusCode: 200,
    body: `Hello world. The time is ${new Date().toISOString()}`,
  }
})
