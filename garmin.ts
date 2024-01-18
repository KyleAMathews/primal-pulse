import { Client } from "pg"
import { v4 as uuidv4 } from "uuid"
const { GarminConnect } = require(`garmin-connect`)
const _ = require(`lodash`)
const { DATABASE_URL } = require(`./db/util.cjs`)
console.log({ DATABASE_URL })
const client = new Client({ connectionString: DATABASE_URL })
import { main } from "./api/_garmin-core.mjs"

main({
  pgClient: client,
  garminOptions: {
    username: `mathews.kyle@gmail.com`,
    password: process.env.GARMIN_PASSWORD,
  },
})
