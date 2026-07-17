import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/api"
import { getAuthUser } from "@/lib/server/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/leave/[id]  { status: "Approved" | "Rejected" }
// Admin-only: approve or reject a pending request.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Only admins can approve or reject leave" }, { status: 403 })
    }

    const { id } = await params
    const { status } = await request.json()
    if (status !== "Approved" && status !== "Rejected") {
      return NextResponse.json({ error: "Status must be Approved or Rejected" }, { status: 400 })
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, department: true },
        },
      },
    })

    return NextResponse.json(leaveRequest)
  } catch (err) {
    console.error("Error updating leave request:", err)
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 })
  }
}

// DELETE /api/leave/[id]
// An employee can withdraw their own request while it's still Pending.
// Admins can cancel any request.
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.leaveRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }

    const isOwner = user.employeeId && existing.employee_id === user.employeeId
    if (user.role !== "Admin" && !isOwner) {
      return NextResponse.json({ error: "You can only cancel your own requests" }, { status: 403 })
    }
    if (user.role !== "Admin" && existing.status !== "Pending") {
      return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 400 })
    }

    await prisma.leaveRequest.delete({ where: { id } })
    return NextResponse.json({ message: "Leave request cancelled" })
  } catch (err) {
    console.error("Error cancelling leave request:", err)
    return NextResponse.json({ error: "Failed to cancel leave request" }, { status: 500 })
  }
}