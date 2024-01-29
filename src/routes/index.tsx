import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useElectricData } from "electric-query"
import { Flex, Button, Heading, Text, Box, Em, Strong } from "@radix-ui/themes"
import { useLiveQuery } from "electric-sql/react"
import { Electric } from "../generated/client"
import { Line } from "@ant-design/charts"
import { useElectric } from "../context"
import { useUser } from "@clerk/clerk-react"

const lambdaFunction = import.meta.env.PROD
  ? `https://7dr5i4gfxg.execute-api.us-east-1.amazonaws.com`
  : `https://owqae9qlal.execute-api.us-east-1.amazonaws.com`

function BusyButton({ setRandom }) {
  const [busy, setBusy] = useState(false)
  const {
    user: { id },
  } = useUser()

  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await fetch(lambdaFunction + `?userId=${id}`)
        setBusy(false)
        // Trigger re-running query
        setTimeout(() => {
          setRandom(Math.random())
        }, 1000)
      }}
    >
      Fetch Latest Garmin Activities
    </Button>
  )
}

function calculateTimeProgress() {
  const now = new Date()

  // Adjust for weeks starting on Monday
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
  )
  const endOfWeek = new Date(
    startOfWeek.getFullYear(),
    startOfWeek.getMonth(),
    startOfWeek.getDate() + 7
  )
  const weekProgress = ((now - startOfWeek) / (endOfWeek - startOfWeek)) * 100

  // For the month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthProgress =
    ((now - startOfMonth) / (endOfMonth - startOfMonth)) * 100

  return { weekProgress, monthProgress }
}

const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
const monthsVal = isMobile ? `3` : `12`

function Chart({ dailyMinAccmumulation, seriesField, title }) {
  if (dailyMinAccmumulation.length === 0) {
    return
  }
  const weeklyAccumulation = dailyMinAccmumulation.map((i) => {
    return {
      day: i.day,
      category: `weekly`,
      count: Math.round((i.weekly_accumulated_duration / 60 / 60) * 10) / 10,
    }
  })
  const monthlyAccumulation = dailyMinAccmumulation.map((i) => {
    return {
      day: i.day,
      category: `monthly`,
      count: Math.round((i.monthly_accumulated_duration / 60 / 60) * 10) / 10,
    }
  })
  const props = {
    data: [...weeklyAccumulation, ...monthlyAccumulation],
    xField: (d) => new Date(d.day),
    yField: `count`,
    title,
    axis: {
      y: {
        title: `Hours of movement`,
      },
    },
    seriesField,
    height: isMobile ? 300 : 600,
    colorField: seriesField,
  }

  return (
    <div
      style={{
        height: isMobile ? 300 : 600,
        marginLeft: -12,
        marginRight: -12,
      }}
    >
      {` `}
      <Line {...props} />
    </div>
  )
}

const queries = ({ db }: { db: Electric[`db`] }) => {
  return {}
}

Index.queries = queries

export default function Index() {
  const { db } = useElectric()!
  const {
    user: { id },
  } = useUser()
  const [dailyMinAccmumulation, setDailyMinAccumulation] = useState()
  const [dailyWalkingMinAccmumulation, setWalkingDailyMinAccumulation] =
    useState([])
  const [dailyRunningMinAccmumulation, setRunningDailyMinAccumulation] =
    useState([])
  const [dailyCyclingMinAccmumulation, setCyclingDailyMinAccumulation] =
    useState([])
  const [dailyGymMinAccmumulation, setGymDailyMinAccumulation] = useState([])
  const [random, setRandom] = useState(Math.random())

  useEffect(() => {
    db.raw({
      sql: `WITH RECURSIVE DateSeries (date) AS (
    SELECT date('now', '-${monthsVal} months') AS date
    UNION ALL
    SELECT date(date, '+1 day') FROM DateSeries
    WHERE date < date('now')
),
Workouts AS (
    SELECT 
        date(e.date) AS workout_date, 
        COALESCE(SUM(json_extract(e.attributes, '$.elapsedDuration')), 0) AS daily_duration
    FROM 
        garmin_data e
    WHERE 
        e.type = 'activity' AND
        e.user_id = '${id}' AND
        e.date >= date('now', '-${monthsVal} months') AND
        (e.attributes->'activityType'->>'typeKey' = 'hiking' OR e.attributes->'activityType'->>'typeKey' = 'walking')
    GROUP BY 
        workout_date
)
SELECT 
    ds.date AS day,
    strftime('%Y-%m', ds.date) AS month,
    strftime('%Y-W%W', ds.date) AS week,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-%m', ds.date) ORDER BY ds.date), 0) AS monthly_accumulated_duration,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-W%W', ds.date) ORDER BY ds.date), 0) AS weekly_accumulated_duration
FROM 
    DateSeries ds
LEFT JOIN 
    Workouts w ON ds.date = w.workout_date
ORDER BY 
    ds.date;
`,
    }).then((results) => {
      console.log({ results })
      setWalkingDailyMinAccumulation(results)
    })
    db.raw({
      sql: `WITH RECURSIVE DateSeries (date) AS (
    SELECT date('now', '-${monthsVal} months') AS date
    UNION ALL
    SELECT date(date, '+1 day') FROM DateSeries
    WHERE date < date('now')
),
Workouts AS (
    SELECT 
        date(e.date) AS workout_date, 
        COALESCE(SUM(json_extract(e.attributes, '$.elapsedDuration')), 0) AS daily_duration
    FROM 
        garmin_data e
    WHERE 
        e.type = 'activity' AND
        e.user_id = '${id}' AND
        e.date >= date('now', '-${monthsVal} months') AND
        (e.attributes->'activityType'->>'typeKey' = 'indoor_cardio')
    GROUP BY 
        workout_date
)
SELECT 
    ds.date AS day,
    strftime('%Y-%m', ds.date) AS month,
    strftime('%Y-W%W', ds.date) AS week,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-%m', ds.date) ORDER BY ds.date), 0) AS monthly_accumulated_duration,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-W%W', ds.date) ORDER BY ds.date), 0) AS weekly_accumulated_duration
FROM 
    DateSeries ds
LEFT JOIN 
    Workouts w ON ds.date = w.workout_date
ORDER BY 
    ds.date;
`,
    }).then((results) => {
      console.log({ results })
      setGymDailyMinAccumulation(results)
    })
    db.raw({
      sql: `WITH RECURSIVE DateSeries (date) AS (
    SELECT date('now', '-${monthsVal} months') AS date
    UNION ALL
    SELECT date(date, '+1 day') FROM DateSeries
    WHERE date < date('now')
),
Workouts AS (
    SELECT 
        date(e.date) AS workout_date, 
        COALESCE(SUM(json_extract(e.attributes, '$.elapsedDuration')), 0) AS daily_duration
    FROM 
        garmin_data e
    WHERE 
        e.type = 'activity' AND
        e.user_id = '${id}' AND
        e.date >= date('now', '-${monthsVal} months') AND
        (e.attributes->'activityType'->>'typeKey' = 'running')
    GROUP BY 
        workout_date
)
SELECT 
    ds.date AS day,
    strftime('%Y-%m', ds.date) AS month,
    strftime('%Y-W%W', ds.date) AS week,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-%m', ds.date) ORDER BY ds.date), 0) AS monthly_accumulated_duration,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-W%W', ds.date) ORDER BY ds.date), 0) AS weekly_accumulated_duration
FROM 
    DateSeries ds
LEFT JOIN 
    Workouts w ON ds.date = w.workout_date
ORDER BY 
    ds.date;
`,
    }).then((results) => {
      console.log({ results })
      setRunningDailyMinAccumulation(results)
    })
    db.raw({
      sql: `WITH RECURSIVE DateSeries (date) AS (
    SELECT date('now', '-${monthsVal} months') AS date
    UNION ALL
    SELECT date(date, '+1 day') FROM DateSeries
    WHERE date < date('now')
),
Workouts AS (
    SELECT 
        date(e.date) AS workout_date, 
        COALESCE(SUM(json_extract(e.attributes, '$.elapsedDuration')), 0) AS daily_duration
    FROM 
        garmin_data e
    WHERE 
        e.type = 'activity' AND
        e.user_id = '${id}' AND
        e.date >= date('now', '-${monthsVal} months')
    GROUP BY 
        workout_date
)
SELECT 
    ds.date AS day,
    strftime('%Y-%m', ds.date) AS month,
    strftime('%Y-W%W', ds.date) AS week,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-%m', ds.date) ORDER BY ds.date), 0) AS monthly_accumulated_duration,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-W%W', ds.date) ORDER BY ds.date), 0) AS weekly_accumulated_duration
FROM 
    DateSeries ds
LEFT JOIN 
    Workouts w ON ds.date = w.workout_date
ORDER BY 
    ds.date;
`,
    }).then((results) => {
      console.log({ results })
      setDailyMinAccumulation(results)
    })
    db.raw({
      sql: `WITH RECURSIVE DateSeries (date) AS (
    SELECT date('now', '-${monthsVal} months') AS date
    UNION ALL
    SELECT date(date, '+1 day') FROM DateSeries
    WHERE date < date('now')
),
Workouts AS (
    SELECT 
        date(e.date) AS workout_date, 
        COALESCE(SUM(json_extract(e.attributes, '$.elapsedDuration')), 0) AS daily_duration
    FROM 
        garmin_data e
    WHERE 
        e.type = 'activity' AND
        e.user_id = '${id}' AND
        e.date >= date('now', '-${monthsVal} months') AND
        (e.attributes->'activityType'->>'typeKey' = 'cycling')
    GROUP BY 
        workout_date
)
SELECT 
    ds.date AS day,
    strftime('%Y-%m', ds.date) AS month,
    strftime('%Y-W%W', ds.date) AS week,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-%m', ds.date) ORDER BY ds.date), 0) AS monthly_accumulated_duration,
    COALESCE(SUM(w.daily_duration) OVER (PARTITION BY strftime('%Y-W%W', ds.date) ORDER BY ds.date), 0) AS weekly_accumulated_duration
FROM 
    DateSeries ds
LEFT JOIN 
    Workouts w ON ds.date = w.workout_date
ORDER BY 
    ds.date;
`,
    }).then((results) => {
      console.log({ results })
      setCyclingDailyMinAccumulation(results)
    })
  }, [db, id, random])

  const { results: user } = useLiveQuery(
    db.users.liveUnique({
      where: {
        id,
      },
    })
  )

  console.log({ dailyMinAccmumulation })
  if (!dailyMinAccmumulation) {
    return null
  }

  const progress = calculateTimeProgress()

  const weeklyAccumulation = dailyMinAccmumulation.map((i) => {
    return {
      day: i.day,
      category: `weekly`,
      count: Math.round((i.weekly_accumulated_duration / 60 / 60) * 10) / 10,
    }
  })
  const monthlyAccumulation = dailyMinAccmumulation.map((i) => {
    return {
      day: i.day,
      category: `monthly`,
      count: Math.round((i.monthly_accumulated_duration / 60 / 60) * 10) / 10,
    }
  })

  return (
    <>
      <Flex direction="column" justify="between">
        <Box mb="4">
          <Heading mb="1">Movement per week/month</Heading>
          <Text as="p">
            With <Em>{progress.weekProgress.toFixed(0)}%</Em> of the week
            complete:{` `}
            <Strong>{weeklyAccumulation.slice(-1)[0].count} hours</Strong>
          </Text>
          <Text as="p">
            With <Em>{progress.monthProgress.toFixed(0)}%</Em> of the month
            complete:
            {` `}
            <Strong>{monthlyAccumulation.slice(-1)[0].count} hours</Strong>
          </Text>
        </Box>
        <Heading size="4">
          Accumulated hours of weekly and monthly movement over the past{` `}
          {monthsVal}
          {` `}
          months
        </Heading>
        <Chart
          dailyMinAccmumulation={dailyMinAccmumulation}
          seriesField={`category`}
          title="Total movement"
        />
        <Chart
          dailyMinAccmumulation={dailyWalkingMinAccmumulation}
          seriesField={`category`}
          title="Walking/Hiking movement"
        />
        <Chart
          dailyMinAccmumulation={dailyRunningMinAccmumulation}
          seriesField={`category`}
          title="Running movement"
        />
        <Chart
          dailyMinAccmumulation={dailyCyclingMinAccmumulation}
          seriesField={`category`}
          title="Cycling movement"
        />
        <Chart
          dailyMinAccmumulation={dailyGymMinAccmumulation}
          seriesField={`category`}
          title="Resistance movement"
        />
        <Heading>Garmin Credentials</Heading>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const formData = Object.fromEntries(new FormData(e.target))
            console.log({ formData })
            await db.users.update({
              data: {
                ...formData,
              },
              where: {
                id,
              },
            })
          }}
        >
          <Flex direction="column" width="max-content" gap="1">
            <Text>email</Text>
            <input
              type="text"
              name="garmin_username"
              defaultValue={user?.garmin_username || ``}
            />
            <Text trim="normal">password</Text>
            <input
              type="password"
              name="garmin_password"
              defaultValue={user?.garmin_password || ``}
            />
            <button type="submit">save</button>
          </Flex>
          <Flex mt="3">
            <BusyButton setRandom={setRandom} />
          </Flex>
        </form>
      </Flex>
    </>
  )
}
