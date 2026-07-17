"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar, FileText, Users } from "lucide-react"
import { LeaveRequestsTable } from "./leave-requests-table"
import { LeaveApplicationDialog } from "./leave-application-dialog"
import type { LeaveRequestDTO } from "@/lib/services/leave"

export function LeaveManagement() {
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [requests, setRequests] = useState<LeaveRequestDTO[]>([])

  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === "Pending").length
    const now = new Date()
    const approvedThisMonth = requests.filter(
      (r) =>
        r.status === "Approved" &&
        new Date(r.created_at).getMonth() === now.getMonth() &&
        new Date(r.created_at).getFullYear() === now.getFullYear()
    ).length
    const onLeaveNow = new Set(
      requests
        .filter(
          (r) =>
            r.status === "Approved" &&
            new Date(r.start_date) <= now &&
            new Date(r.end_date) >= now
        )
        .map((r) => r.employee.id)
    ).size
    const approved = requests.filter((r) => r.status === "Approved")
    const avgDays = approved.length
      ? (approved.reduce((sum, r) => sum + r.days, 0) / approved.length).toFixed(1)
      : "0.0"

    return { pending, approvedThisMonth, onLeaveNow, avgDays }
  }, [requests])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">Manage employee leave requests and entitlements</p>
        </div>
        <Button onClick={() => setShowApplicationDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Leave Request
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting a decision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Requests approved this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees on Leave</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeaveNow}</div>
            <p className="text-xs text-muted-foreground">Currently away</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Leave Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDays}</div>
            <p className="text-xs text-muted-foreground">Per approved request</p>
          </CardContent>
        </Card>
      </div>

      <LeaveRequestsTable onDataChange={setRequests} />

      <LeaveApplicationDialog
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}
      />
    </div>
  )
}
