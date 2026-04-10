/**
 * Module: score distribution chart
 * Responsibility: Render the submission score distribution for the admin dashboard
 * Inputs/Outputs: Accepts normalized score distribution points and returns a chart or empty state
 * Dependencies: Depends on Recharts and the shared admin styles
 * Notes: The histogram keeps the x-axis semantic to score ranges and the y-axis to submission counts
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ScoreDistributionPoint } from '../api/analyticsApi'

interface ScoreTrendChartProps {
  points: ScoreDistributionPoint[]
}

export function ScoreTrendChart({ points }: ScoreTrendChartProps) {
  if (points.length === 0) {
    return (
      <section className="admin-panel">
        <h2 className="admin-panel__title">Score Distribution</h2>
        <p className="admin-panel__copy">
          No submissions have been recorded yet.
        </p>
      </section>
    )
  }

  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">Score Distribution</h2>
      <div className="analytics-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points}>
            <CartesianGrid stroke="rgba(0, 0, 0, 0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(value: unknown) => `${String(value ?? 0)} submissions`} />
            <Bar
              dataKey="submissionCount"
              fill="var(--accent)"
              radius={[10, 10, 0, 0]}
              maxBarSize={72}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
