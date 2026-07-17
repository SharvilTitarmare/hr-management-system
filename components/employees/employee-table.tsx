"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Mail, Phone, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-store"
import { deleteEmployee, type EmployeeDTO } from "@/lib/services/employees"
import { departmentColor } from "@/lib/department-colors"

interface EmployeeTableProps {
  searchTerm: string
  onDataChange?: (employees: EmployeeDTO[]) => void
}

const EMPLOYEES_KEY = "/api/employees?limit=100&page=1"

function initials(first: string, last: string) {
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase()
}

export function EmployeeTable({ searchTerm, onDataChange }: EmployeeTableProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === "Admin"
  const { mutate } = useSWRConfig()

  const { data, error, isLoading } = useSWR<{ employees: EmployeeDTO[] }>(EMPLOYEES_KEY, {
    onSuccess: (d) => onDataChange?.(d.employees),
  })
  const employees = data?.employees ?? []

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    setDeleting(true)
    try {
      await deleteEmployee(pendingDeleteId)
      setPendingDeleteId(null)
      mutate(EMPLOYEES_KEY) // instant refresh instead of waiting for the next poll
    } finally {
      setDeleting(false)
    }
  }

  const filtered = employees.filter((emp) => {
    const q = searchTerm.toLowerCase()
    return (
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.employee_id.toLowerCase().includes(q)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading employees...
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive py-6">{error.message}</p>
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-16 text-center border border-dashed rounded-xl">
        {employees.length === 0 ? "No employees yet — add your first one." : "No employees match your search."}
      </p>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((emp) => {
          const color = departmentColor(emp.department)
          return (
            <div
              key={emp.id}
              className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* badge notch */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-2 h-4 w-8 rounded-full bg-background border border-border" />
              <div className={`h-1.5 w-full ${color.stripe}`} />

              <div className="p-5 pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-full flex items-center justify-center font-display font-semibold text-sm ${color.dot} text-primary-foreground`}
                    >
                      {initials(emp.first_name, emp.last_name)}
                    </div>
                    <div>
                      <p className="font-display font-semibold leading-tight">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{emp.position}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status === "Active" ? "default" : "secondary"} className="shrink-0">
                    {emp.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono tracking-wider text-muted-foreground">#{emp.employee_id}</span>
                  <span className="text-muted-foreground">{emp.department}</span>
                </div>

                <div className="space-y-1.5 border-t border-border pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {emp.phone}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => setPendingDeleteId(emp.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes their record and leave history permanently. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-white">
              {deleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
