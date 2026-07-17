import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/api"
import { getAuthUser } from "@/lib/server/auth"
import { LeaveStatus } from "@prisma/client"

// GET /api/leave?status=Pending&employee_id=xxx
// Admins see everyone's requests (optionally filtered). Employees only ever
// see their own — even if they pass employee_id, it's ignored for them.
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") as LeaveStatus | null
    const requestedEmployeeId = searchParams.get("employee_id")

    let employeeFilter: string | undefined
    if (user.role === "Admin") {
      employeeFilter = requestedEmployeeId || undefined
    } else {
      if (!user.employeeId) {
        // This login isn't linked to an employee record yet
        return NextResponse.json({ leaveRequests: [] })
      }
      employeeFilter = user.employeeId
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        ...(employeeFilter && { employee_id: employeeFilter }),
        ...(status && { status }),
      },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, department: true },
        },
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json({ leaveRequests })
  } catch (err) {
    console.error("Error fetching leave requests:", err)
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 })
  }
}

// POST /api/leave
// Employees apply for their own leave. Admins can apply on behalf of anyone
// by passing employee_id explicitly.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { leave_type, start_date, end_date, reason, reliever, employee_id } = body

    const targetEmployeeId = user.role === "Admin" && employee_id ? employee_id : user.employeeId

    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: "This account isn't linked to an employee record" },
        { status: 400 }
      )
    }

    if (!leave_type || !start_date || !end_date || !reason || !reliever) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const start = new Date(start_date)
    const end = new Date(end_date)
    if (end < start) {
      return NextResponse.json({ error: "End date can't be before start date" }, { status: 400 })
    }
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employee_id: targetEmployeeId,
        leave_type,
        start_date: start,
        end_date: end,
        days,
        reason,
        reliever,
        status: "Pending",
      },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, department: true },
        },
      },
    })

    return NextResponse.json(leaveRequest, { status: 201 })
  } catch (err) {
    console.error("Error creating leave request:", err)
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 })
  }
}
