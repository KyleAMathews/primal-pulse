import { main } from "../_garmin-core.mjs"

export default async function handler(request, response) {
  // console.log(`request`, request)
  const { id } = request.query
  console.log({ id })
  await main(id)

  response.status(200).json({
    body: request.body,
    query: request.query,
    cookies: request.cookies,
  })
}
