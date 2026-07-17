"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Check, X, Loader2 } from "lucide-react"
import { LiveBadge } from "@/components/ui/live-badge"
import { useAuth } from "@/lib/auth-store"
import { updateLeaveStatus, type LeaveRequestDTO } from "@/lib/services/leave"

interface LeaveRequestsTableProps {
  onDataChange?: (requests: LeaveRequestDTO[]) => void
  refreshKey?: number
}

const LEAVE_KEY = "/api/leave"

export function LeaveRequestsTable({ onDataChange }: LeaveRequestsTableProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === "Admin"
  const { mutate } = useSWRConfig()

  const { data, error, isLoading } = useSWR<{ leaveRequests: LeaveRequestDTO[] }>(LEAVE_KEY, {
    onSuccess: (d) => onDataChange?.(d.leaveRequests),
  })
  const requests = data?.leaveRequests ?? []

  const [actioningId, setActioningId] = useState<string | null>(null)

  const handleDecision = async (id: string, status: "Approved" | "Rejected") => {
    setActioningId(id)
    try {
      await updateLeaveStatus(id, status)
      mutate(LEAVE_KEY) // instant refresh instead of waiting for the next poll
    } finally {
      setActioningId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      Pending: "outline",
      Approved: "default",
      Rejected: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{isAdmin ? "Recent Leave Requests" : "My Leave Requests"}</CardTitle>
          <CardDescription>
            {isAdmin ? "Latest leave applications requiring attention" : "Your leave history and current status"}
          </CardDescription>
        </div>
        <LiveBadge />
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-4">{error.message}</p>}

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading leave requests...
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No leave requests yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  {isAdmin && (
                    <TableCell className="font-medium">
                      {request.employee.first_name} {request.employee.last_name}
                    </TableCell>
                  )}
                  <TableCell>{request.leave_type}</TableCell>
                  <TableCell>{new Date(request.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(request.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{request.days}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {request.status === "Pending" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={actioningId === request.id}>
                              {actioningId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDecision(request.id, "Approved")}>
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDecision(request.id, "Rejected")}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">Decided</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
