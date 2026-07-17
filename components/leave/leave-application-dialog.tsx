"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { mutate } from "swr"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-store"
import { applyForLeave } from "@/lib/services/leave"
import { fetchEmployees, type EmployeeDTO } from "@/lib/services/employees"

interface LeaveApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitted?: () => void
}

export function LeaveApplicationDialog({ open, onOpenChange, onSubmitted }: LeaveApplicationDialogProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === "Admin"

  const [employees, setEmployees] = useState<EmployeeDTO[]>([])
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    reliever: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && isAdmin) {
      fetchEmployees().then((data) => setEmployees(data.employees)).catch(() => setEmployees([]))
    }
  }, [open, isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isAdmin && !formData.employeeId) {
      setError("Please select an employee")
      return
    }

    setSubmitting(true)
    try {
      await applyForLeave({
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason,
        reliever: formData.reliever,
        ...(isAdmin && { employee_id: formData.employeeId }),
      })
      setFormData({ employeeId: "", leaveType: "", startDate: "", endDate: "", reason: "", reliever: "" })
      onOpenChange(false)
      mutate("/api/leave")
      onSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit leave request")
    } finally {
      setSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }
    return 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Leave Application</DialogTitle>
          <DialogDescription>Submit a new leave request. All fields marked with * are required.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Details</CardTitle>
              <CardDescription>Specify your leave requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee *</Label>
                  <Select value={formData.employeeId} onValueChange={(value) => updateFormData("employeeId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} — {emp.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type *</Label>
                  <Select value={formData.leaveType} onValueChange={(value) => updateFormData("leaveType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                      <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                      <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                      <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                      <SelectItem value="Study Leave">Study Leave</SelectItem>
                      <SelectItem value="Compassionate Leave">Compassionate Leave</SelectItem>
                      <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateFormData("startDate", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateFormData("endDate", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Days</Label>
                  <div className="flex items-center justify-center h-10 px-3 py-2 border border-input bg-background rounded-md">
                    <span className="text-sm font-medium">{calculateDays()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Leave *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => updateFormData("reason", e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Handover Details</CardTitle>
              <CardDescription>Specify who will handle your responsibilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reliever">Reliever/Substitute *</Label>
                <Input
                  id="reliever"
                  value={formData.reliever}
                  onChange={(e) => updateFormData("reliever", e.target.value)}
                  placeholder="Name of colleague who will cover your duties"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
