"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Code2, Users, CalendarClock } from "lucide-react"
import { fetchReports, type ReportsResponse } from "@/lib/services/reports"
import { departmentColor } from "@/lib/department-colors"

const QUERIES: Record<string, string> = {
  "Leave by department": `SELECT
  e.department,
  COUNT(lr.id) AS total_requests,
  COUNT(*) FILTER (WHERE lr.status = 'Pending')  AS pending,
  COUNT(*) FILTER (WHERE lr.status = 'Approved') AS approved,
  COUNT(*) FILTER (WHERE lr.status = 'Rejected') AS rejected,
  SUM(lr.days) FILTER (WHERE lr.status = 'Approved') AS total_days_approved
FROM "LeaveRequest" lr
JOIN "Employee" e ON e.id = lr.employee_id
GROUP BY e.department
ORDER BY total_requests DESC;`,
  "Headcount & tenure": `SELECT
  department,
  COUNT(*) AS headcount,
  ROUND(AVG(EXTRACT(YEAR FROM AGE(NOW(), start_date)))::numeric, 1) AS avg_tenure_years,
  ROUND(AVG(basic_salary)::numeric, 0) AS avg_salary
FROM "Employee"
WHERE status = 'Active'
GROUP BY department
ORDER BY headcount DESC;`,
  "Who's on leave now": `SELECT
  e.employee_id, e.first_name, e.last_name, e.department,
  lr.leave_type, lr.start_date, lr.end_date, lr.days
FROM "LeaveRequest" lr
JOIN "Employee" e ON e.id = lr.employee_id
WHERE lr.status = 'Approved'
  AND lr.start_date <= NOW()
  AND lr.end_date >= NOW()
ORDER BY lr.end_date ASC;`,
}

export function ReportsDashboard() {
  const [data, setData] = useState<ReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSql, setShowSql] = useState(false)

  useEffect(() => {
    fetchReports()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load reports"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Running reports...
      </div>
    )
  }

  if (error) return <p className="text-sm text-destructive py-6">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Aggregate views across departments, computed with raw SQL</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSql((s) => !s)}>
          <Code2 className="h-4 w-4 mr-2" />
          {showSql ? "Hide SQL" : "View SQL"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Leave by department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Leave Requests by Department
            </CardTitle>
            <CardDescription>Counts by status, plus total approved days taken</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.leaveByDepartment.length === 0 && (
              <p className="text-sm text-muted-foreground">No leave requests yet.</p>
            )}
            {data.leaveByDepartment.map((row) => {
              const color = departmentColor(row.department)
              return (
                <div key={row.department} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                    <span className="text-sm font-medium">{row.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Badge variant="outline">{row.pending} pending</Badge>
                    <Badge variant="outline">{row.approved} approved</Badge>
                    <span className="text-muted-foreground ml-1">{row.totalDaysApproved} days total</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Headcount & tenure */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Headcount &amp; Tenure by Department
            </CardTitle>
            <CardDescription>Active employees, average years on the job, average salary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.headcountByDepartment.length === 0 && (
              <p className="text-sm text-muted-foreground">No active employees yet.</p>
            )}
            {data.headcountByDepartment.map((row) => {
              const color = departmentColor(row.department)
              return (
                <div key={row.department} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                    <span className="text-sm font-medium">{row.department}</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{row.headcount} employees · {row.avgTenureYears ?? "—"} yrs avg tenure</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* On leave now */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currently On Leave</CardTitle>
          <CardDescription>Approved leave requests overlapping today&apos;s date</CardDescription>
        </CardHeader>
        <CardContent>
          {data.onLeaveNow.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody is on leave right now.</p>
          ) : (
            <div className="space-y-2">
              {data.onLeaveNow.map((row) => (
                <div key={row.employee_id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <span className="font-medium">{row.first_name} {row.last_name}</span>
                  <span className="text-muted-foreground">{row.leave_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.start_date).toLocaleDateString()} – {new Date(row.end_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showSql && (
        <div className="space-y-4">
          {Object.entries(QUERIES).map(([title, sql]) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono bg-secondary rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                  {sql}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
