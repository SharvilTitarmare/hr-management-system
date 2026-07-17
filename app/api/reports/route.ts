import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/api"
import { getAuthUser } from "@/lib/server/auth"

/**
 * These three reports are deliberately written as raw SQL instead of Prisma's
 * query builder. Prisma is great for simple CRUD, but once you need JOINs
 * across tables, GROUP BY aggregation, or date-range math, hand-written SQL
 * is clearer and often faster than chaining ORM calls and reducing in JS.
 */

interface DepartmentLeaveRow {
  department: string
  total_requests: bigint
  pending: bigint
  approved: bigint
  rejected: bigint
  total_days_approved: bigint | null
}

interface DepartmentHeadcountRow {
  department: string
  headcount: bigint
  avg_tenure_years: number | null
  avg_salary: number | null
}

interface OnLeaveNowRow {
  employee_id: string
  first_name: string
  last_name: string
  department: string
  leave_type: string
  start_date: Date
  end_date: Date
  days: number
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Reports are admin-only" }, { status: 403 })
    }

    // 1. Leave requests grouped by department, with a JOIN back to Employee
    //    and a conditional SUM to only total approved days.
    const leaveByDepartment = await prisma.$queryRaw<DepartmentLeaveRow[]>`
      SELECT
        e.department,
        COUNT(lr.id) AS total_requests,
        COUNT(*) FILTER (WHERE lr.status = 'Pending')  AS pending,
        COUNT(*) FILTER (WHERE lr.status = 'Approved') AS approved,
        COUNT(*) FILTER (WHERE lr.status = 'Rejected') AS rejected,
        SUM(lr.days) FILTER (WHERE lr.status = 'Approved') AS total_days_approved
      FROM "LeaveRequest" lr
      JOIN "Employee" e ON e.id = lr.employee_id
      GROUP BY e.department
      ORDER BY total_requests DESC
    `

    // 2. Headcount + average tenure + average salary per department.
    //    AGE() and EXTRACT() do the tenure math directly in Postgres.
    const headcountByDepartment = await prisma.$queryRaw<DepartmentHeadcountRow[]>`
      SELECT
        department,
        COUNT(*) AS headcount,
        ROUND(AVG(EXTRACT(YEAR FROM AGE(NOW(), start_date)))::numeric, 1) AS avg_tenure_years,
        ROUND(AVG(basic_salary)::numeric, 0) AS avg_salary
      FROM "Employee"
      WHERE status = 'Active'
      GROUP BY department
      ORDER BY headcount DESC
    `

    // 3. Who's on approved leave right now — a JOIN with a date-range WHERE.
    const onLeaveNow = await prisma.$queryRaw<OnLeaveNowRow[]>`
      SELECT
        e.employee_id,
        e.first_name,
        e.last_name,
        e.department,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.days
      FROM "LeaveRequest" lr
      JOIN "Employee" e ON e.id = lr.employee_id
      WHERE lr.status = 'Approved'
        AND lr.start_date <= NOW()
        AND lr.end_date >= NOW()
      ORDER BY lr.end_date ASC
    `

    // Postgres returns COUNT/SUM as BigInt via the driver; JSON can't
    // serialize BigInt, so convert everything to plain numbers here.
    const toNumber = (v: bigint | null) => (v === null ? 0 : Number(v))

    return NextResponse.json({
      leaveByDepartment: leaveByDepartment.map((r) => ({
        department: r.department,
        totalRequests: toNumber(r.total_requests),
        pending: toNumber(r.pending),
        approved: toNumber(r.approved),
        rejected: toNumber(r.rejected),
        totalDaysApproved: toNumber(r.total_days_approved),
      })),
      headcountByDepartment: headcountByDepartment.map((r) => ({
        department: r.department,
        headcount: toNumber(r.headcount),
        avgTenureYears: r.avg_tenure_years,
        avgSalary: r.avg_salary,
      })),
      onLeaveNow,
    })
  } catch (err) {
    console.error("Error generating reports:", err)
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 })
  }
}
