import { useLocation } from "react-router-dom"
import { useElectricData } from "electric-query"
import { Flex, Heading, Text, Box, Em, Strong } from "@radix-ui/themes"
import { Electric } from "../generated/client"
import { Line } from "@ant-design/charts"

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

console.log({ isMobile })

function Chart({ data, seriesField }) {
  const props = {
    data,
    xField: (d) => new Date(d.day),
    yField: `count`,
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
  return {
    activities: db.garmin_data.liveMany(),
    dailyMinAccmumulation: db.raw({
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
    }),
  }
}

Index.queries = queries

export default function Index() {
  const location = useLocation()
  const { activities, dailyMinAccmumulation } = useElectricData(
    location.pathname + location.search
  )
  console.log({ activities })
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
  console.log({ weeklyAccumulation, monthlyAccumulation })
  const progress = calculateTimeProgress()
  console.log(`Week progress: ${progress.weekProgress.toFixed(1)}%`)
  console.log(`Month progress: ${progress.monthProgress.toFixed(1)}%`)

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
          Acumulated hours of weekly and monthly movement over the past{` `}
          {monthsVal}
          {` `}
          months
        </Heading>
        <Chart
          data={[...weeklyAccumulation, ...monthlyAccumulation]}
          seriesField={`category`}
        />
      </Flex>
    </>
  )
}
