/**
 * Module: score trend chart
 * Responsibility: Render the submission score trend for the admin dashboard
 * Inputs/Outputs: Accepts normalized score trend points and returns a chart or empty state
 * Dependencies: Depends on Recharts and the shared admin styles
 * Notes: Keep chart formatting simple so later analytics slices can change the data source without reworking the component contract
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ScoreTrendPoint } from '../api/analyticsApi'

interface ScoreTrendChartProps {
  points: ScoreTrendPoint[]
}

export function ScoreTrendChart({ points }: ScoreTrendChartProps) {
  if (points.length === 0) {
    return (
      <section className="admin-panel">
        <h2 className="admin-panel__title">Score Trend</h2>
        <p className="admin-panel__copy">
          No submissions have been recorded yet.
        </p>
      </section>
    )
  }

  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">Score Trend</h2>
      <div className="analytics-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid stroke="rgba(0, 0, 0, 0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(value: unknown) => `${String(value ?? 0)}%`} />
            <Line
              type="monotone"
              dataKey="scorePercent"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
