"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users } from "lucide-react"
import { EmployeeTable } from "./employee-table"
import { AddEmployeeDialog } from "./add-employee-dialog"
import { useAuth } from "@/lib/auth-store"
import { LiveBadge } from "@/components/ui/live-badge"
import type { EmployeeDTO } from "@/lib/services/employees"

export function EmployeeManagement() {
  const { user } = useAuth()
  const isAdmin = user?.role === "Admin"

  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [employees, setEmployees] = useState<EmployeeDTO[]>([])

  const departmentCount = useMemo(() => new Set(employees.map((e) => e.department)).size, [employees])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-display font-bold tracking-tight">Employee Directory</h2>
            <LiveBadge />
          </div>
          <p className="text-muted-foreground">
            {employees.length} employee{employees.length === 1 ? "" : "s"} across {departmentCount} department
            {departmentCount === 1 ? "" : "s"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
          <Users className="h-3.5 w-3.5" />
          {employees.length} total
        </div>
      </div>

      <EmployeeTable searchTerm={searchTerm} onDataChange={setEmployees} />

      {isAdmin && (
        <AddEmployeeDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      )}
    </div>
  )
}
